import { knowledgeAssetRepository } from '@/lib/repositories/KnowledgeAssetRepository';
import { assetSpaceLinkRepository } from '@/lib/repositories/AssetSpaceLinkRepository';
import { IngestAuditService } from './IngestAuditService';
import { IngestValidator } from './IngestValidator';
import { IngestStorageService } from './IngestStorageService';
import { IngestStrategyService } from './IngestStrategyService';
import { IngestOptions, IngestPrepareResult } from './types';
import crypto from 'node:crypto';
import { logEvento } from '@/lib/logger';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';
import { KnowledgeAsset, KnowledgeAssetSchema } from '@/lib/schemas/assets';
import { EntityIdSchema, TenantIdSchema } from '@/lib/schemas/common';
import { type Filter } from 'mongodb';
import { SafeFilter } from '@/lib/repositories/BaseRepository';
import { ValidationError, ExternalServiceError } from '@/lib/errors';

/**
 * IngestPreparer: Handles validations, deduplication and initial storage.
 * Refactored Phase 213: Delegating to specialized services.
 * Hardened Era 8: Strict types and centralized repository.
 */
export class IngestPreparer {
    private static async log(data: { level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', action: string, message: string, correlationId?: string, tenantId?: string, details?: any }) {
        return logEvento({
            source: 'INGEST_PREPARER',
            ...data
        });
    }

    static async prepare(options: IngestOptions): Promise<IngestPrepareResult> {
        const { file, metadata, tenantId, environment = 'PRODUCTION' } = options;
        if (!file) throw new ValidationError('File is required for preparation');

        const correlationId = options.correlationId || CorrelationIdService.generate();
        const start = Date.now();
        const scope = metadata.scope || 'TENANT';
        const spaceId = metadata.spaceId;

        // 1. Validations
        metadata.chunkingLevel = IngestValidator.normalizeChunkingLevel(metadata.chunkingLevel) as IngestOptions['metadata']['chunkingLevel'];
        const sizeBytes = file.size || 0;
        IngestValidator.validateFileSize(sizeBytes);

        if (IngestValidator.shouldUseStreaming(sizeBytes)) {
            await this.log({
                level: 'WARN',
                action: 'LARGE_FILE_DETECTED',
                message: `Large file (${(sizeBytes / 1024 / 1024).toFixed(2)}MB). Streaming mode.`,
                correlationId,
                tenantId
            });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileHash = crypto.createHash('md5').update(buffer).digest('hex');
        console.log(`[INGEST_TRACE] File hashed: ${fileHash}, Size: ${sizeBytes} bytes`);

        // 2. Deduplication check (BEFORE storage to avoid redundant uploads)
        console.log('[INGEST_TRACE] Checking for duplicates...');
        const dedupeQuery: Filter<SafeFilter<KnowledgeAsset>> = {
            fileMd5: fileHash,
            tenantId: (scope === 'TENANT' ? tenantId : { $in: ['global', 'abd_global'] }) as any,
            spaceId: spaceId ? (knowledgeAssetRepository.toObjectId(spaceId) as any) : undefined, // Hardened Era 12
            environment: environment as any
        };

        const existingDoc = await knowledgeAssetRepository.findForDeduplication(dedupeQuery, options.session as any) as any;
        console.log(`[INGEST_TRACE] Deduplication query result: ${existingDoc ? 'Found' : 'Not found'} (ID: ${existingDoc?._id})`);

        if (existingDoc && existingDoc._id) {
            // Restoration logic
            if (existingDoc.deletedAt) {
                await knowledgeAssetRepository.update(existingDoc._id, {
                    status: 'ACTIVE',
                    ingestionStatus: 'PENDING',
                    correlationId
                } as any, options.session as any);

                await IngestAuditService.logEvent({
                    docId: existingDoc._id.toString(),
                    correlationId,
                    tenantId,
                    action: 'RESTORE',
                    status: 'SUCCESS',
                    performedBy: options.session?.user?.id || 'system',
                    filename: file.name,
                    sizeBytes,
                    md5: fileHash,
                    details: {
                        duration_ms: Date.now() - start
                    }
                }, options.session);

                return { docId: existingDoc._id.toString(), status: 'PENDING', correlationId, savings: 0 };
            }

            // Duplicate Prevention
            const hasChunks = (existingDoc.totalChunks || 0) > 0;
            const isForce = metadata.force === true || metadata.force === 'true';

            if (existingDoc.ingestionStatus === 'COMPLETED' && hasChunks && !isForce) {
                await IngestAuditService.logEvent({
                    docId: existingDoc._id.toString(),
                    correlationId,
                    tenantId,
                    action: 'DUPLICATE_BLOCK',
                    status: 'DUPLICATE',
                    performedBy: options.session?.user?.id || 'system',
                    filename: file.name,
                    sizeBytes,
                    md5: fileHash,
                    details: {
                        duration_ms: Date.now() - start
                    }
                }, options.session);
                return { docId: existingDoc._id.toString(), status: 'DUPLICATE', correlationId, isDuplicate: true, savings: 0 };
            }

            // Fallback for corrupted records: if storage is missing OR ingestion failed without storage, we delete and proceed to re-create
            const isCorrupted = !existingDoc.source?.downloadUrl && !existingDoc.blobId && !existingDoc.cloudinaryUrl;
            const isFailedWithoutStorage = existingDoc.ingestionStatus === 'FAILED' && !existingDoc.source?.downloadUrl && !existingDoc.blobId;

            if (isCorrupted || isFailedWithoutStorage) {
                console.log(`[INGEST_TRACE] Existing asset ${existingDoc._id} is corrupted or failed without storage. Purging for clean recreation...`);
                await (knowledgeAssetRepository as any).deleteEntity(existingDoc._id, options.session as any, true);
            } else {
                console.log(`[INGEST_TRACE] Found valid existing asset ${existingDoc._id}. Returning PENDING for processing.`);
                return { docId: existingDoc._id.toString(), status: 'PENDING', correlationId, savings: 0 };
            }
        }

        // 3. Storage Strategy (Only if NO duplicate was found or it was deleted)
        let blobId: string | undefined;
        let cloudinaryResult: { success: boolean, url?: string, publicId?: string, error?: string } | undefined;
        const isV2 = IngestStrategyService.isV2Enabled();

        if (isV2) {
            try {
                console.log('[INGEST_TRACE] Attempting GridFS storage...');
                blobId = await IngestStorageService.saveToGridFS(buffer, tenantId, correlationId);
                console.log(`[INGEST_TRACE] GridFS success: ${blobId}`);
            } catch (err) {
                console.warn('[INGEST_TRACE] GridFS save failed, falling back to Cloudinary...');
            }
        }

        // Mandatory Fallback or V1
        if (!blobId) {
            console.log('[INGEST_TRACE] Uploading to Cloudinary...');
            cloudinaryResult = await IngestStorageService.uploadToCloudinary(buffer, { filename: file.name, tenantId }, correlationId, fileHash);
            
            if (!cloudinaryResult.success) {
                console.error(`[INGEST_TRACE] FATAL: Storage failed completely: ${cloudinaryResult.error}`);
                throw new ExternalServiceError(`Critical Storage Failure: ${cloudinaryResult.error || 'Unknown Cloudinary error'}`, { service: 'CLOUDINARY' });
            }
            console.log(`[INGEST_TRACE] Cloudinary upload success: ${cloudinaryResult.publicId}`);
        }

        // 4. Register Asset (Era 12 structure)
        const docMetadata: Omit<KnowledgeAsset, '_id'> = {
            tenantId: (scope === 'TENANT' ? tenantId : 'global') as any, // Cast to any for Branded Type compatibility in DB
            industry: (metadata.industry || 'GENERIC') as any,
            source: {
                filename: file.name,
                originalName: file.name,
                mimeType: (file as any).type || 'application/pdf',
                sizeBytes,
                checksum: fileHash,
                storageProvider: blobId ? 'gcs' : 'cloudinary',
                storageKey: blobId || cloudinaryResult?.publicId || fileHash,
                downloadUrl: cloudinaryResult?.url ?? undefined, // Ensure null doesn't enter the data flow
            },
            ownerId: options.session?.user?.id ? (options.session.user.id as any) : undefined,
            componentType: (metadata.type || 'DOCUMENT') as any,
            version: Number(metadata.version) || 1,
            status: 'ACTIVE',
            ingestionStatus: 'PENDING',
            totalChunks: 0,
            documentTypeId: metadata.documentTypeId ? (metadata.documentTypeId as any) : (() => { throw new ValidationError('documentTypeId is required'); })(),
            scope: scope as any,
            spaceId: spaceId ? (spaceId as any) : (() => { throw new ValidationError('spaceId is required'); })(),
            chunkingLevel: metadata.chunkingLevel as any,
            environment: environment as any,
            correlationId,
            usage: (metadata.usage || 'REFERENCE') as any,
            skipIndexing: !!metadata.skipIndexing,
            blobId,
            fileMd5: fileHash, // Persistence of search field
            hasStorage: !!(blobId || (cloudinaryResult && cloudinaryResult.url)),
            language: 'es',
            cloudinaryUrl: cloudinaryResult?.url ?? undefined, // Legacy compatibility
            cloudinaryPublicId: cloudinaryResult?.publicId, // Legacy compatibility
            spacePath: options.spacePath, // Phase 344
            createdAt: new Date(),
            updatedAt: new Date(),
            collaborators: [],
            processingPipeline: [],
            domainMetadata: {},
            usageStats: { viewCount: 0, downloadCount: 0, queryCount: 0 },
            chunkIds: [],
            reviewStatus: 'pending',
            reviewHistory: [],
            progress: 0,
            isDeleted: false,
            versionHistory: [],
            enableVision: false,
            enableTranslation: false,
            enableGraphRag: false,
            enableCognitive: false,
            enableHierarchicalRag: false
        };

        console.log('[INGEST_TRACE] Registering new asset in DB...');
        const insertedId = await knowledgeAssetRepository.create(docMetadata, options.session as any);
        const finalDocId = EntityIdSchema.parse(insertedId);
        console.log(`[INGEST_TRACE] Asset registered successfully. finalDocId: ${finalDocId}`);

        // 5. Create Space Link (Phase 359: Missing link causing management UI issues)
        if (spaceId) {
            console.log(`[INGEST_TRACE] Creating AssetSpaceLink for spaceId: ${spaceId}...`);
            await assetSpaceLinkRepository.create({
                assetId: finalDocId,
                spaceId: EntityIdSchema.parse(spaceId),
                spacePath: options.spacePath || "",
                tenantId: TenantIdSchema.parse(tenantId),
                isPrimary: true, // During ingestion, this is the primary space
                createdAt: new Date(),
                isDeleted: false
            }, options.session);
        }

        await IngestAuditService.logEvent({
            docId: finalDocId,
            correlationId,
            tenantId,
            action: 'REGISTER',
            status: 'SUCCESS',
            performedBy: options.session?.user?.id || 'system',
            filename: file.name,
            sizeBytes,
            md5: fileHash,
            details: {
                duration_ms: Date.now() - start,
                source: 'ADMIN_INGEST',
                pipelineV2: isV2,
                blobId: blobId || null
            }
        }, options.session);

        return { docId: finalDocId, status: 'PENDING', correlationId, savings: 0 };
    }
}
