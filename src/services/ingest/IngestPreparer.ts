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
        const knowledgeAssetsCollection = await getTenantCollection('knowledge_assets');
        const auditCollection = await getTenantCollection('audit_ingestion');

        // Deduplication Query
        const dedupeQuery: any = {
            fileMd5: fileHash,
            ingestionStatus: { $ne: 'FAILED' }
        };

        if (scope === 'TENANT') {
            dedupeQuery.tenantId = tenantId;
        } else if (scope === 'GLOBAL') {
            dedupeQuery.scope = 'GLOBAL';
        }

        const existingDoc = await knowledgeAssetsCollection.findOne(dedupeQuery);

        if (existingDoc) {
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

        // 2. Initial Upload
        const cloudinaryResult = await withRetry(
            () => uploadRAGDocument(buffer, file.name, tenantId),
            { maxRetries: 3, initialDelayMs: 1000 }
        );

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
            details: { source: 'ADMIN_INGEST', scope, duration_ms: Date.now() - start }
        }));

        return { docId: result.insertedId.toString(), status: 'PENDING', correlationId };
    }
}
