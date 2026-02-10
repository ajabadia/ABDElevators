import crypto from 'crypto';
import { getTenantCollection } from '@/lib/db-tenant';
import { KnowledgeAssetSchema, IngestAuditSchema } from '@/lib/schemas';
import { ValidationError } from '@/lib/errors';
import { withRetry } from '@/lib/retry';
import { uploadRAGDocument } from '@/lib/cloudinary';
import { IngestOptions } from '../ingest-service';

/**
 * IngestPreparer: Handles validations, deduplication and initial storage (Phase 105 Hygiene).
 */
export class IngestPreparer {
    static async prepare(options: IngestOptions) {
        const { file, metadata, tenantId, environment = 'PRODUCTION' } = options;
        const correlationId = options.correlationId || crypto.randomUUID();
        const start = Date.now();
        const scope = metadata.scope || 'TENANT';
        const industry = metadata.industry || 'ELEVATORS';

        // 1. Critical Size Validation
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        // @ts-ignore
        const fileSize = file.size || 0;
        if (fileSize > MAX_FILE_SIZE) {
            throw new ValidationError(`File too large. Max size is 50MB. Received: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileHash = crypto.createHash('md5').update(buffer).digest('hex');

        // Enforcement of Rule #11 (Using SecureCollection indirectly via getTenantCollection)
        const session = options.session;
        const knowledgeAssetsCollection = await getTenantCollection('knowledge_assets', session);
        const auditCollection = await getTenantCollection('audit_ingestion', session);

        const dedupeQuery: any = {
            fileMd5: fileHash,
            tenantId: scope === 'TENANT' ? tenantId : 'global',
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
                        }
                    },
                    { includeDeleted: true }
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

                return { docId: existingDoc._id.toString(), status: 'PENDING', correlationId };
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
                return { docId: existingDoc._id.toString(), status: 'DUPLICATE', correlationId, isDuplicate: true };
            }

            // If it's PENDING or FAILED, we return it as PENDING to allow the UI to track it/retry
            return { docId: existingDoc._id.toString(), status: 'PENDING', correlationId };
        }

        // 2. Physical Deduplication (Phase 125.1)
        const fileBlobsCollection = await getTenantCollection('file_blobs', session);
        let fileBlob = await fileBlobsCollection.findOne({ _id: fileHash as any });
        let cloudinaryResult;

        if (fileBlob) {
            // Deduplication Hit! Reuse existing blob
            console.log(`[IngestPreparer] Deduplication HIT for MD5 ${fileHash}. Reusing blob.`);
            cloudinaryResult = {
                secureUrl: fileBlob.cloudinaryUrl,
                publicId: fileBlob.cloudinaryPublicId
            };
            // Async refCount increment (fire & forget for speed, or await if strict)
            await fileBlobsCollection.updateOne(
                { _id: fileHash as any },
                { $inc: { refCount: 1 }, $set: { lastSeenAt: new Date() } }
            );
        } else {
            // New Blob - Upload to Cloudinary
            const uploadResult = await withRetry(
                () => uploadRAGDocument(buffer, file.name, tenantId),
                { maxRetries: 3, initialDelayMs: 1000 }
            );

            cloudinaryResult = {
                secureUrl: uploadResult.secureUrl,
                publicId: uploadResult.publicId
            };

            // Register new Blob
            try {
                // Use upsert to handle race conditions where another thread might have inserted it
                await fileBlobsCollection.updateOne(
                    { _id: fileHash as any },
                    {
                        $setOnInsert: {
                            _id: fileHash as any,
                            cloudinaryUrl: cloudinaryResult.secureUrl,
                            cloudinaryPublicId: cloudinaryResult.publicId,
                            mimeType: (file as any).type || 'application/pdf',
                            sizeBytes: fileSize,
                            refCount: 1,
                            firstSeenAt: new Date(),
                            lastSeenAt: new Date(),
                            tenantId: 'abd_global', // Phase 125.1 Fix
                            storageProvider: 'cloudinary',
                            metadata: { originalFilename: file.name, uploadedBy: options.userEmail }
                        }
                    },
                    { upsert: true }
                );
            } catch (e) {
                console.warn('[IngestPreparer] Blob insert race condition ignored', e);
            }
        }

        // 3. Initial Registry
        const docMetadata = {
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
            sizeBytes: fileSize,
            totalChunks: 0,
            documentTypeId: metadata.documentTypeId,
            scope,
            environment,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

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
                deduplicated: !!fileBlob // Audit if it was deduplicated
            }
        }));

        return { docId: result.insertedId.toString(), status: 'PENDING', correlationId, savings: fileBlob ? fileSize : 0 };
    }
}
