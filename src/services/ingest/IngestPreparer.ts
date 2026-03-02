import { knowledgeAssetRepository } from '@/lib/repositories/KnowledgeAssetRepository';
import { IngestAuditService } from './IngestAuditService';
import { IngestValidator } from './IngestValidator';
import { IngestStorageService } from './IngestStorageService';
import { IngestStrategyService } from './IngestStrategyService';
import { IngestOptions, IngestPrepareResult } from './types';
import { logEvento } from '@/lib/logger';
import { type KnowledgeAsset } from '@/lib/schemas';
import { type Filter } from 'mongodb';
import { ValidationError } from '@/lib/errors';

/**
 * IngestPreparer: Handles validations, deduplication and initial storage.
 * Refactored Phase 213: Delegating to specialized services.
 * Hardened Era 8: Strict types and centralized repository.
 */
export class IngestPreparer {
    static async prepare(options: IngestOptions): Promise<IngestPrepareResult> {
        const { file, metadata, tenantId, environment = 'PRODUCTION' } = options;
        if (!file) throw new ValidationError('File is required for preparation');

        const correlationId = options.correlationId || crypto.randomUUID();
        const start = Date.now();
        const scope = metadata.scope || 'TENANT';
        const spaceId = metadata.spaceId;

        // 1. Validations
        metadata.chunkingLevel = IngestValidator.normalizeChunkingLevel(metadata.chunkingLevel) as IngestOptions['metadata']['chunkingLevel'];
        const sizeBytes = file.size || 0;
        IngestValidator.validateFileSize(sizeBytes);

        if (IngestValidator.shouldUseStreaming(sizeBytes)) {
            await logEvento({
                level: 'WARN',
                source: 'INGEST_PREPARER',
                action: 'LARGE_FILE_DETECTED',
                message: `Large file (${(sizeBytes / 1024 / 1024).toFixed(2)}MB). Streaming mode.`,
                correlationId,
                tenantId
            });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileHash = crypto.createHash('md5').update(buffer).digest('hex');

        // 2. Storage Strategy (v2 Pipeline)
        let blobId: string | undefined;
        const isV2 = IngestStrategyService.isV2Enabled();

        if (isV2) {
            try {
                blobId = await IngestStorageService.saveToGridFS(buffer, tenantId, correlationId);
            } catch (err) {
                console.warn('[IngestPreparer] GridFS save failed, falling back...');
            }
        }

        // 3. Deduplication Check
        const dedupeQuery: Filter<KnowledgeAsset> = {
            fileMd5: fileHash,
            tenantId: (scope === 'TENANT' ? tenantId : { $in: ['global', 'abd_global'] }) as Filter<KnowledgeAsset>['tenantId'],
            spaceId,
            environment: environment as Filter<KnowledgeAsset>['environment']
        };

        const existingDoc = await knowledgeAssetRepository.findForDeduplication(dedupeQuery, options.session as any);

        if (existingDoc) {
            // Restoration logic
            if ((existingDoc as Record<string, unknown>).deletedAt) {
                await knowledgeAssetRepository.update(existingDoc._id, {
                    $unset: { deletedAt: "" },
                    $set: {
                        status: 'vigente',
                        ingestionStatus: 'PENDING',
                        updatedAt: new Date(),
                        correlationId
                    }
                }, options.session as any);

                await IngestAuditService.logEvent({
                    assetId: existingDoc._id.toString(),
                    correlationId,
                    tenantId,
                    action: 'RESTORE',
                    status: 'SUCCESS',
                    details: {
                        filename: file.name,
                        sizeBytes,
                        md5: fileHash,
                        performedBy: options.userEmail
                    }
                }, options.session);

                return { docId: existingDoc._id.toString(), status: 'PENDING', correlationId, savings: 0 };
            }

            // Duplicate Prevention
            const hasChunks = (existingDoc.totalChunks || 0) > 0;
            const isForce = metadata.force === true || metadata.force === 'true';

            if (existingDoc.ingestionStatus === 'COMPLETED' && hasChunks && !isForce) {
                await IngestAuditService.logEvent({
                    assetId: existingDoc._id.toString(),
                    correlationId,
                    tenantId,
                    action: 'DUPLICATE_BLOCK',
                    status: 'WARNING',
                    details: {
                        filename: file.name,
                        sizeBytes,
                        md5: fileHash,
                        performedBy: options.userEmail
                    }
                }, options.session);
                return { docId: existingDoc._id.toString(), status: 'DUPLICATE', correlationId, isDuplicate: true, savings: 0 };
            }

            // Fallback for corrupted records
            if (!existingDoc.cloudinaryUrl && !isV2) {
                await knowledgeAssetRepository.deletePhysical(existingDoc._id, options.session as any);
            } else {
                return { docId: existingDoc._id.toString(), status: 'PENDING', correlationId, savings: 0 };
            }
        }

        // 4. Register Asset
        const docMetadata: Omit<KnowledgeAsset, '_id'> = {
            tenantId: (scope === 'TENANT' ? tenantId : 'global') as string,
            industry: (metadata.industry || 'GENERIC') as KnowledgeAsset['industry'],
            filename: file.name,
            componentType: (metadata.type || 'DOCUMENT') as any,
            model: 'PENDING',
            version: metadata.version || '1.0',
            revisionDate: new Date(),
            status: 'vigente',
            ingestionStatus: 'PENDING',
            fileMd5: fileHash,
            sizeBytes,
            documentTypeId: metadata.documentTypeId,
            scope: scope as any,
            spaceId,
            chunkingLevel: metadata.chunkingLevel as KnowledgeAsset['chunkingLevel'],
            environment: environment as KnowledgeAsset['environment'],
            correlationId,
            enableVision: !!options.enableVision,
            enableTranslation: !!options.enableTranslation,
            enableGraphRag: !!options.enableGraphRag,
            enableCognitive: !!options.enableCognitive,
            usage: (metadata.usage || 'REFERENCE') as any,
            skipIndexing: !!metadata.skipIndexing,
            blobId,
            hasStorage: !!blobId,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any;

        const insertedId = await knowledgeAssetRepository.create(docMetadata, null, options.session as any);

        await IngestAuditService.logEvent({
            assetId: insertedId,
            correlationId,
            tenantId,
            action: 'REGISTER',
            status: 'SUCCESS',
            details: {
                filename: file.name,
                sizeBytes,
                md5: fileHash,
                performedBy: options.userEmail,
                source: 'ADMIN_INGEST',
                pipelineV2: isV2,
                blobId: blobId || null
            }
        }, options.session);

        return { docId: insertedId, status: 'PENDING', correlationId, savings: 0 };
    }
}
