import crypto from 'crypto';
import { getTenantCollection } from '@/lib/db-tenant';
import { KnowledgeAssetSchema, IngestAuditSchema } from '@/lib/schemas';
import { ValidationError, AppError } from '@/lib/errors';
import { IngestOptions } from '../ingest-service';
import { logEvento } from '@/lib/logger';
import { FeatureFlags } from '@/lib/feature-flags';
import { GridFSUtils } from '@/lib/gridfs-utils';

import { IngestPrepareResult } from './types';

/**
 * IngestPreparer: Handles validations, deduplication and initial storage (Phase 105 Hygiene).
 */
export class IngestPreparer {
    static async prepare(options: IngestOptions): Promise<IngestPrepareResult> {
        const { file, metadata, tenantId, environment = 'PRODUCTION' } = options;
        const correlationId = options.correlationId || crypto.randomUUID();
        const start = Date.now();
        const scope = metadata.scope || 'TENANT';
        const industry = metadata.industry || 'ELEVATORS';
        const spaceId = metadata.spaceId; // 🌌 Phase 125.2

        // 1. Critical Size Validation (Phase 131.6: Large File Support)
        const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB
        // @ts-ignore
        const fileSize = file.size || 0;
        if (fileSize > MAX_FILE_SIZE) {
            throw new ValidationError(`File too large. Max size is 250MB. Received: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
        }

        // Phase 131.6: Warn for large files (>100MB) - use streaming
        const USE_STREAMING_THRESHOLD = 100 * 1024 * 1024; // 100MB - use streaming above this
        const useStreaming = fileSize > USE_STREAMING_THRESHOLD;

        if (useStreaming) {
            await logEvento({
                level: 'WARN',
                source: 'INGEST_PREPARER',
                action: 'LARGE_FILE_DETECTED',
                message: `Large file detected (${(fileSize / 1024 / 1024).toFixed(2)}MB). Using streaming mode.`,
                correlationId,
                tenantId
            });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileHash = crypto.createHash('md5').update(buffer).digest('hex');

        // Feature Flag Check (Phase 44)
        const isV2Enabled = FeatureFlags.isEnabled('INGEST_PIPELINE_V2', { tenantId: options.tenantId });

        let blobId: string | undefined;
        if (isV2Enabled) {
            try {
                blobId = await GridFSUtils.saveForProcessing(buffer, tenantId, 'pending', correlationId);
                await logEvento({
                    level: 'INFO',
                    source: 'INGEST_PREPARER',
                    action: 'GRIDFS_SAVE_SUCCESS',
                    message: `File saved to GridFS for processing: ${blobId}`,
                    correlationId,
                    tenantId
                });
            } catch (gridfsError) {
                await logEvento({
                    level: 'WARN',
                    source: 'INGEST_PREPARER',
                    action: 'GRIDFS_SAVE_FAILED',
                    message: `Failed to save to GridFS, continuing with Cloudinary only: ${gridfsError}`,
                    correlationId,
                    tenantId,
                    details: { error: (gridfsError as Error).message }
                });
                // Continue without GridFS - Cloudinary-only mode
            }
        }

        // Enforcement of Rule #11 (Using SecureCollection indirectly via getTenantCollection)
        const session = options.session;
        const knowledgeAssetsCollection = await getTenantCollection('knowledge_assets', session);
        const auditCollection = await getTenantCollection('audit_ingestion', session);

        const dedupeQuery: any = {
            fileMd5: fileHash,
            tenantId: scope === 'TENANT' ? tenantId : { $in: ['global', 'abd_global'] },
            spaceId: spaceId, // 🌌 Refinar por espacio si se provee
            environment
        };

        const existingDoc = await knowledgeAssetsCollection.findOne(dedupeQuery, { includeDeleted: true });

        if (existingDoc) {
            // restoration logic for soft-deleted docs
            if (existingDoc.deletedAt) {
                console.log(`[IngestPreparer] Restoring soft-deleted asset: ${existingDoc._id}`);
                await knowledgeAssetsCollection.updateOne(
                    { _id: existingDoc._id },
                    {
                        $unset: { deletedAt: "" },
                        $set: {
                            status: 'vigente',
                            ingestionStatus: 'PENDING',
                            updatedAt: new Date(),
                            // Update metadata if it changed
                            version: metadata.version,
                            documentTypeId: metadata.documentTypeId,
                            correlationId,
                        }
                    }
                );

                await auditCollection.insertOne(IngestAuditSchema.parse({
                    tenantId,
                    performedBy: options.userEmail,
                    filename: file.name,
                    fileSize,
                    md5: fileHash,
                    docId: existingDoc._id,
                    correlationId,
                    status: 'RESTORED',
                    details: { source: 'ADMIN_INGEST', duration_ms: Date.now() - start }
                }));

                return { docId: existingDoc._id.toString(), status: 'PENDING', correlationId, savings: 0 };
            }

            // Rule #7: If it's failed/pending, let the worker handle retry if needed, 
            // but for the prep phase it already "exists" in the registry.
            if (existingDoc.ingestionStatus === 'COMPLETED') {
                await auditCollection.insertOne(IngestAuditSchema.parse({
                    tenantId,
                    performedBy: options.userEmail,
                    filename: file.name,
                    fileSize,
                    md5: fileHash,
                    docId: existingDoc._id,
                    correlationId,
                    status: 'DUPLICATE',
                    details: { source: 'ADMIN_INGEST', duration_ms: Date.now() - start }
                }));
                return { docId: existingDoc._id.toString(), status: 'DUPLICATE', correlationId, isDuplicate: true, savings: 0 };
            }

            // If it's PENDING or FAILED, check if it's corrupted (missing URL)
            if (!existingDoc.cloudinaryUrl) {
                console.warn(`[IngestPreparer] Existing asset ${existingDoc._id} is corrupted (missing Cloudinary URL). Deleting to allow fresh re-upload.`);
                await knowledgeAssetsCollection.deleteOne({ _id: existingDoc._id });
                // Fall through to allow creating a new clean record
            } else {
                await logEvento({
                    level: 'INFO',
                    source: 'INGEST_PREPARER',
                    action: 'DOCUMENT_RECOVERY_SUCCESS',
                    message: `Existing asset ${existingDoc._id} recovered and updated to PENDING.`,
                    correlationId,
                    tenantId
                });
                return { docId: existingDoc._id.toString(), status: 'PENDING', correlationId, savings: 0 };
            }
        }

        // 2. Physical Deduplication (Phase 125.1 Unified)
        let blob;
        let isBlobDeduplicated = false;

        try {
            const { BlobStorageService } = await import('@/services/storage/BlobStorageService');
            const result = await BlobStorageService.getOrCreateBlob(
                buffer,
                { filename: file.name, mimeType: (file as any).type || 'application/pdf' },
                {
                    tenantId,
                    userId: options.userEmail,
                    correlationId,
                    source: 'RAG_INGEST'
                },
                session
            );
            blob = result.blob;
            isBlobDeduplicated = result.deduplicated;
        } catch (error: any) {
            // Log the storage failure
            await logEvento({
                level: 'ERROR',
                source: 'INGEST_PREPARER',
                action: 'STORAGE_FAILED',
                message: `Universal storage failed: ${error.message}`,
                correlationId,
                tenantId,
                stack: error.stack
            });

            // Create a FAILED asset record for traceability
            const failedAsset = {
                tenantId: scope === 'TENANT' ? tenantId : 'global',
                industry,
                filename: file.name,
                componentType: metadata.type,
                model: 'PENDING',
                version: metadata.version,
                revisionDate: new Date(),
                status: 'vigente',
                ingestionStatus: 'FAILED',
                error: `Storage failed: ${error.message}`,
                cloudinaryUrl: null,
                cloudinaryPublicId: null,
                fileMd5: fileHash,
                sizeBytes: fileSize,
                totalChunks: 0,
                documentTypeId: metadata.documentTypeId,
                scope,
                spaceId, // 🌌 Phase 125.2
                environment,
                correlationId,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = await knowledgeAssetsCollection.insertOne(failedAsset);

            return {
                docId: result.insertedId.toString(),
                status: 'FAILED',
                correlationId,
                error: `Storage failed: ${error.message}`,
                savings: 0
            };
        }

        const cloudinaryResult = {
            secureUrl: blob.secureUrl || blob.url || (blob as any).cloudinaryUrl,
            publicId: blob.providerId || (blob as any).cloudinaryPublicId
        };

        // 3. Initial Registry
        const docMetadata: any = {
            tenantId: scope === 'TENANT' ? tenantId : 'global',
            industry,
            filename: file.name,
            componentType: metadata.type,
            model: 'PENDING',
            version: metadata.version,
            revisionDate: new Date(),
            status: 'vigente',
            ingestionStatus: 'PENDING',
            cloudinaryUrl: cloudinaryResult.secureUrl,
            cloudinaryPublicId: cloudinaryResult.publicId,
            fileMd5: fileHash,
            fileSize: fileSize,
            totalChunks: 0,
            documentTypeId: metadata.documentTypeId,
            scope,
            spaceId, // 🌌 Phase 125.2
            chunkingLevel: metadata.chunkingLevel || 'bajo', // Phase 134
            environment,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Phase 131: Add blobId if GridFS save was successful
        if (isV2Enabled && blobId) {
            docMetadata.blobId = blobId;
            docMetadata.hasStorage = true; // GridFS storage is available
        }

        const result = await knowledgeAssetsCollection.insertOne(KnowledgeAssetSchema.parse(docMetadata));

        await auditCollection.insertOne(IngestAuditSchema.parse({
            tenantId,
            performedBy: options.userEmail,
            filename: file.name,
            fileSize,
            md5: fileHash,
            docId: result.insertedId,
            correlationId,
            status: 'PENDING',
            details: {
                source: 'ADMIN_INGEST',
                scope,
                duration_ms: Date.now() - start,
                deduplicated: isBlobDeduplicated, // Audit if it was deduplicated
                blobId: blobId || null, // Phase 131: GridFS blob ID
                pipelineV2: isV2Enabled // Phase 131: Track which pipeline was used
            }
        }));

        return { docId: result.insertedId.toString(), status: 'PENDING', correlationId, savings: isBlobDeduplicated ? fileSize : 0 };
    }
}
