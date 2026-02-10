import { IKnowledgeRepository } from '../../domain/repositories/IKnowledgeRepository';
import { IAuditRepository } from '../../domain/repositories/IAuditRepository';
import { IngestAnalyzer } from '@/services/ingest/IngestAnalyzer';
import { IngestIndexer } from '@/services/ingest/IngestIndexer';
import { AppError } from '@/lib/errors';
import crypto from 'crypto';
import { PermissionService } from '../security/PermissionService';
import { AppPermission } from '@/types/permissions';
import { TenantTier } from '@/types/tiers';
import { UserRole } from '@/types/roles';
import { StateTransitionValidator } from '@/services/ingest/observability/StateTransitionValidator';
import { DeadLetterQueue } from '@/services/ingest/recovery/DeadLetterQueue';

export interface ExecuteIngestionAnalysisInput {
    docId: string;
    correlationId: string;
    userEmail: string;
    userContext: {
        role: UserRole;
        tenantId: string;
        tier: TenantTier;
        permissionGroups?: string[];
        permissionOverrides?: string[];
    };
    environment: string;
    maskPii: boolean;
    job?: any;
}

export class ExecuteIngestionAnalysisUseCase {
    constructor(
        private knowledgeRepo: IKnowledgeRepository,
        private auditRepo: IAuditRepository
    ) { }

    async execute(input: ExecuteIngestionAnalysisInput) {
        const { docId, correlationId, userEmail, userContext, environment, maskPii, job } = input;
        const start = Date.now();

        // 🛡️ [SECURITY] Permission Check (Phase 120.1)
        const canIngest = await PermissionService.can(userContext, AppPermission.KNOWLEDGE_INGEST);
        if (!canIngest) {
            throw new AppError('FORBIDDEN', 403, `User ${userEmail} does not have permission to ingest knowledge assets`);
        }

        // 1. Fetch Asset State
        const asset = await this.knowledgeRepo.findById(docId);
        if (!asset) {
            throw new AppError('NOT_FOUND', 404, `Knowledge asset ${docId} not found`);
        }

        const currentAttempts = (asset.attempts || 0) + 1;

        const updateProgress = async (percent: number) => {
            if (job) await job.updateProgress(percent);
            await this.knowledgeRepo.updateProgress(docId, percent);
        };

        try {
            // 1. Validate state transition: QUEUED/PENDING -> PROCESSING
            const currentStatus = asset.ingestionStatus;
            if (currentStatus !== 'QUEUED' && currentStatus !== 'PENDING') {
                throw new AppError(
                    'VALIDATION_ERROR',
                    400,
                    `Invalid starting state: ${currentStatus}. Expected QUEUED or PENDING.`
                );
            }

            await StateTransitionValidator.validate(
                currentStatus,
                'PROCESSING',
                correlationId,
                asset.tenantId!,
                docId,
                'Starting ingestion analysis'
            );

            // 2. Update Status to PROCESSING
            await this.knowledgeRepo.updateStatus(docId, 'PROCESSING', {
                attempts: currentAttempts,
                environment: environment as any
            });

            await updateProgress(5);

            // 3. Infrastructure: Fetch from Storage (Currently in-line, will be abstracted in next step)
            const response = await fetch(encodeURI(asset.cloudinaryUrl as string));
            if (!response.ok) throw new Error(`Failed to fetch from Cloudinary: ${response.statusText}`);
            const buffer = Buffer.from(await response.arrayBuffer());

            await updateProgress(15);

            // 4. Step 2: Full Analysis (Domain Service)
            const analysis = await IngestAnalyzer.analyze(buffer, asset, correlationId);
            await updateProgress(60);

            // 5. Step 3: Indexing (Domain Service)
            const successCount = await IngestIndexer.index(
                analysis.rawText,
                analysis.visualFindings,
                asset,
                analysis.documentContext,
                analysis.detectedIndustry,
                analysis.detectedLang,
                correlationId,
                updateProgress
            );

            // 6. SUCCESS: Validate transition PROCESSING -> COMPLETED
            await StateTransitionValidator.validate(
                'PROCESSING',
                'COMPLETED',
                correlationId,
                asset.tenantId!,
                docId,
                'Ingestion analysis completed successfully'
            );

            // 7. Success Update
            await this.knowledgeRepo.updateStatus(docId, 'COMPLETED', {
                progress: 100,
                model: analysis.detectedModels[0]?.model || 'UNKNOWN',
                language: analysis.detectedLang,
                totalChunks: successCount,
                industry: analysis.detectedIndustry,
                contextHeader: analysis.documentContext as any
            });

            // 7. Audit Log
            await this.auditRepo.logIngestion({
                tenantId: asset.tenantId!,
                performedBy: userEmail,
                filename: asset.filename,
                fileSize: asset.sizeBytes || 0,
                md5: asset.fileMd5 || 'unknown',
                docId: asset._id as any,
                correlationId,
                status: 'SUCCESS',
                timestamp: new Date(),
                details: {
                    source: 'ASYNC_WORKER',
                    chunks: successCount,
                    duration_ms: Date.now() - start
                }
            });

            return { success: true, correlationId, chunks: successCount };

        } catch (error: any) {
            console.error(`[USE_CASE_ERROR] ${docId}`, error);

            // FAILURE: Validate transition PROCESSING -> FAILED
            await StateTransitionValidator.validate(
                'PROCESSING',
                'FAILED',
                correlationId,
                asset.tenantId!,
                docId,
                `Analysis failed: ${error.message}`
            );

            await this.knowledgeRepo.updateStatus(docId, 'FAILED', {
                error: error.message,
                progress: asset.progress || 0
            });

            // Add to Dead Letter Queue for manual review
            await DeadLetterQueue.addToQueue({
                tenantId: asset.tenantId!,
                docId,
                correlationId,
                jobType: 'PDF_ANALYSIS',
                failureReason: error.message,
                retryCount: currentAttempts,
                lastAttempt: new Date(),
                stackTrace: error.stack,
                jobData: { input, startTime: start }
            });

            await this.auditRepo.logIngestion({
                tenantId: asset.tenantId!,
                performedBy: userEmail,
                filename: asset.filename,
                fileSize: asset.sizeBytes || 0,
                md5: asset.fileMd5 || 'unknown',
                docId: asset._id as any,
                correlationId,
                status: 'FAILED',
                timestamp: new Date(),
                details: {
                    chunks: 0,
                    error: error.message,
                    duration_ms: Date.now() - start
                }
            });

            throw error;
        }
    }
}
