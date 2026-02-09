import 'server-only';
import { IKnowledgeRepository } from '../../domain/repositories/IKnowledgeRepository';
import { IAuditRepository } from '../../domain/repositories/IAuditRepository';
import { AppError, ValidationError } from '@/lib/errors';
import { IngestPreparer } from '@/services/ingest/IngestPreparer';
import crypto from 'crypto';
import { IngestOptions } from '@/core/domain/types/IngestTypes';
import { uploadRAGDocument } from '@/lib/cloudinary';
import { withRetry } from '@/lib/retry';
import { queueService } from '@/lib/queue-service';

export class PrepareIngestionUseCase {
    constructor(
        private knowledgeRepo: IKnowledgeRepository,
        private auditRepo: IAuditRepository
    ) { }

    async execute(options: IngestOptions) {
        const { file, metadata, tenantId, environment = 'PRODUCTION', userEmail, correlationId } = options;
        const start = Date.now();
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

        // 1. Validation
        // @ts-ignore
        if (file.size > MAX_FILE_SIZE) {
            throw new ValidationError(`File too large. Max size is 50MB.`);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileHash = crypto.createHash('md5').update(buffer).digest('hex');

        // 2. Deduplication
        const existingDoc = await this.knowledgeRepo.findByHash(fileHash, tenantId);

        if (existingDoc) {
            await this.auditRepo.logIngestion({
                tenantId,
                performedBy: userEmail || 'unknown',
                filename: file.name,
                fileSize: file.size,
                md5: fileHash,
                docId: existingDoc._id,
                correlationId: correlationId || crypto.randomUUID(),
                status: 'DUPLICATE',
                details: { source: 'ADMIN_INGEST', duration_ms: Date.now() - start }
            });

            return {
                success: true,
                message: 'Document already indexed.',
                docId: existingDoc._id.toString(),
                isDuplicate: true
            };
        }

        // 3. Upload to Storage (Cloudinary)
        const cloudinaryResult = await withRetry(
            () => uploadRAGDocument(buffer, file.name, tenantId),
            { maxRetries: 3, initialDelayMs: 1000 }
        );

        // 4. Create Knowledge Asset
        const docMetadata = {
            tenantId,
            industry: metadata.industry || 'ELEVATORS',
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
            sizeBytes: file.size,
            totalChunks: 0,
            documentTypeId: metadata.documentTypeId,
            scope: metadata.scope || 'TENANT',
            environment,
            language: 'es', // Defaulting to Spanish
            progress: 0,
            attempts: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const asset = await this.knowledgeRepo.create(docMetadata as any);
        const docId = asset._id ? asset._id.toString() : ''; // Handle _id existence

        await this.auditRepo.logIngestion({
            tenantId,
            performedBy: userEmail || 'unknown',
            filename: file.name,
            fileSize: file.size,
            md5: fileHash,
            docId: asset._id,
            correlationId: correlationId || crypto.randomUUID(),
            status: 'PENDING',
            details: { source: 'ADMIN_INGEST', scope: metadata.scope, duration_ms: Date.now() - start }
        });

        // 5. Enqueue Async Analysis
        try {
            const job = await queueService.addJob('PDF_ANALYSIS', {
                tenantId,
                userId: userEmail || 'system', // Approximation as userId wasn't in options, passed email
                correlationId: correlationId || crypto.randomUUID(),
                data: {
                    docId: docId,
                    options: {
                        maskPii: true, // Defaulting as specific option passing refactor is complex
                        userEmail,
                        environment
                    }
                }
            });

            return {
                success: true,
                message: 'Ingestion started in background.',
                docId: docId,
                jobId: job.id,
                correlationId
            };
        } catch (queueError) {
            console.error('[QUEUE ERROR]', queueError);
            return {
                success: true,
                message: 'Ingestion persisted but queue failed. Check logs.',
                docId: docId,
                jobId: null,
                correlationId
            };
        }
    }
}
