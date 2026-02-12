import 'server-only';
import { IKnowledgeRepository } from '../../domain/repositories/IKnowledgeRepository';
import { IAuditRepository } from '../../domain/repositories/IAuditRepository';
import { IngestPreparer } from '@/services/ingest/IngestPreparer';
import crypto from 'crypto';
import { IngestOptions } from '@/services/ingest-service';
import { queueService } from '@/lib/queue-service';
import { StateTransitionValidator } from '@/services/ingest/observability/StateTransitionValidator';

/**
 * PrepareIngestionUseCase - Orchestrates ingestion preparation
 * Phase 3 Refactoring: Delegates to IngestPreparer.prepare()
 * 
 * Responsibilities:
 * 1. Delegate preparation to IngestPreparer (dedup, upload)
 * 2. Handle state transitions (PENDING → QUEUED)
 * 3. Enqueue async analysis job
 */
export class PrepareIngestionUseCase {
    constructor(
        private knowledgeRepo: IKnowledgeRepository,
        private auditRepo: IAuditRepository
    ) { }

    async execute(options: IngestOptions) {
        const { tenantId, environment = 'PRODUCTION', userEmail, correlationId: inputCorrelationId } = options;
        const correlationId = inputCorrelationId || crypto.randomUUID();

        // 1. DELEGATE to IngestPreparer for all preparation logic
        const prepareResult = await IngestPreparer.prepare({
            ...options,
            correlationId
        });

        // Handle deduplication/restoration cases
        if (prepareResult.status === 'DUPLICATE') {
            return {
                success: true,
                message: 'Document already indexed.',
                docId: prepareResult.docId,
                isDuplicate: true,
                correlationId
            };
        }

        // prepareResult.status === 'PENDING' (new asset created)
        const docId = prepareResult.docId;

        if (prepareResult.status === 'FAILED') {
            return {
                success: false,
                message: prepareResult.error || 'Preparation failed.',
                docId,
                correlationId
            };
        }

        // 2. Enqueue Async Analysis (Transition: PENDING → QUEUED)
        try {
            // Validate state transition: PENDING → QUEUED
            await StateTransitionValidator.validate(
                'PENDING',
                'QUEUED',
                correlationId,
                tenantId,
                docId,
                'Job enqueued for async processing'
            );

            // Update status to QUEUED
            await this.knowledgeRepo.updateStatus(docId, 'QUEUED', {});

            // Use simple queue instead of BullMQ
            const { ingestionQueue } = await import('@/lib/simple-queue');
            ingestionQueue.add(docId, {
                tenantId,
                userId: userEmail || 'system',
                correlationId,
                maskPii: true,
                userEmail,
                environment
            });

            return {
                success: true,
                message: 'Ingestion started in background.',
                docId,
                jobId: docId, // Use docId as jobId for simplicity
                correlationId,
                savings: prepareResult.savings || 0 // Physical dedup savings
            };
        } catch (queueError) {
            console.error('[QUEUE ERROR]', queueError);
            return {
                success: true,
                message: 'Ingestion persisted but queue failed. Check logs.',
                docId,
                jobId: null,
                correlationId
            };
        }
    }
}
