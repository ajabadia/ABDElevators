
import crypto from 'crypto';
import { KnowledgeAssetRepository } from './KnowledgeAssetRepository';
import { IngestAuditService } from './IngestAuditService';
import { IngestValidator } from './IngestValidator';
import { IngestStorageService } from './IngestStorageService';
import { IngestStrategyService } from './IngestStrategyService';
import { IngestOptions, IngestPrepareResult } from './types';
import { logEvento } from '@/lib/logger';

/**
 * IngestPreparer: Handles validations, deduplication and initial storage.
 * Refactored Phase 213: Delegating to specialized services.
 */
export class IngestPreparer {
    static async prepare(options: IngestOptions): Promise<IngestPrepareResult> {
        const { file, metadata, tenantId, environment = 'PRODUCTION' } = options;
        const correlationId = options.correlationId || crypto.randomUUID();
        const start = Date.now();
        const scope = metadata.scope || 'TENANT';
        const spaceId = metadata.spaceId;

        // 1. Validations
        metadata.chunkingLevel = IngestValidator.normalizeChunkingLevel(metadata.chunkingLevel);
        const sizeBytes = (file as any).size || 0;
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
        const dedupeQuery = {
            fileMd5: fileHash,
            tenantId: scope === 'TENANT' ? tenantId : { $in: ['global', 'abd_global'] },
            spaceId,
            environment
        };

        const existingDoc = await KnowledgeAssetRepository.findForDeduplication(dedupeQuery, options.session);

        if (existingDoc) {
            // Restoration logic
            if (existingDoc.deletedAt) {
                await KnowledgeAssetRepository.update(existingDoc._id, {
                    $unset: { deletedAt: "" },
                    $set: {
                        status: 'vigente',
                        ingestionStatus: 'PENDING',
                        updatedAt: new Date(),
                        correlationId
                    }
                }, options.session, { includeDeleted: true });

                await IngestAuditService.log({
                    tenantId, performedBy: options.userEmail, filename: file.name, sizeBytes,
                    md5: fileHash, docId: existingDoc._id, correlationId, status: 'RESTORED'
                }, options.session);

                return { docId: existingDoc._id.toString(), status: 'PENDING', correlationId, savings: 0 };
            }

            // Duplicate Prevention
            const hasChunks = (existingDoc.totalChunks || 0) > 0;
            const isForce = (metadata as any).force === true || (metadata as any).force === 'true';

            if (existingDoc.ingestionStatus === 'COMPLETED' && hasChunks && !isForce) {
                await IngestAuditService.log({
                    tenantId, performedBy: options.userEmail, filename: file.name, sizeBytes,
                    md5: fileHash, docId: existingDoc._id, correlationId, status: 'DUPLICATE'
                }, options.session);
                return { docId: existingDoc._id.toString(), status: 'DUPLICATE', correlationId, isDuplicate: true, savings: 0 };
            }

            // Fallback for corrupted records
            if (!existingDoc.cloudinaryUrl && !isV2) {
                await KnowledgeAssetRepository.deletePhysical(existingDoc._id, options.session);
            } else {
                return { docId: existingDoc._id.toString(), status: 'PENDING', correlationId, savings: 0 };
            }
        }

        // 4. Register Asset
        const docMetadata = {
            tenantId: scope === 'TENANT' ? tenantId : 'global',
            industry: metadata.industry || 'GENERIC',
            filename: file.name,
            componentType: metadata.type,
            model: 'PENDING',
            version: metadata.version,
            revisionDate: new Date(),
            status: 'vigente',
            ingestionStatus: 'PENDING',
            fileMd5: fileHash,
            sizeBytes,
            documentTypeId: metadata.documentTypeId,
            scope,
            spaceId,
            chunkingLevel: metadata.chunkingLevel,
            environment,
            correlationId,
            enableVision: !!options.enableVision,
            enableTranslation: !!options.enableTranslation,
            enableGraphRag: !!options.enableGraphRag,
            enableCognitive: !!options.enableCognitive,
            usage: metadata.usage || 'REFERENCE',
            skipIndexing: !!metadata.skipIndexing,
            blobId,
            hasStorage: !!blobId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await KnowledgeAssetRepository.create(docMetadata, options.session);

        await IngestAuditService.log({
            tenantId, performedBy: options.userEmail, filename: file.name, sizeBytes,
            md5: fileHash, docId: result.insertedId, correlationId, status: 'PENDING',
            details: { source: 'ADMIN_INGEST', pipelineV2: isV2, blobId: blobId || null }
        }, options.session);

        return { docId: result.insertedId.toString(), status: 'PENDING', correlationId, savings: 0 };
    }
}
