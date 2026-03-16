import { TechnicalEntityService, AnalysisProgress } from '@/services/core/TechnicalEntityService';
import { AnalysisJobPayloadSchema } from './schemas';
import { logEvento } from './logger';
import { IndustryType } from './schemas';

/**
 * 🚀 AsyncJobsLogic (Phase 3: Pipeline Consolidation)
 * Orchestrates background work by delegating to domain services.
 */
export class AsyncJobsLogic {

    /**
     * Orchestrates PDF analysis job (Phase 31: BullMQ).
     * Now delegates to TechnicalEntityService for Single Source of Truth.
     */
    static async processPdfAnalysis(rawJobData: any, jobId: string, updateProgress: (p: number) => Promise<void>) {
        // 🛡️ Rule #2: Zod Validation BEFORE Processing (Era 12)
        const validatedJob = AnalysisJobPayloadSchema.parse(rawJobData);
        const { tenantId, userId, data, correlationId } = validatedJob;
        const { entityId, fileBuffer, filename, industry = 'GENERIC', fileMd5 } = data;

        try {
            await logEvento({
                level: 'INFO',
                source: 'ASYNC_LOGIC',
                action: 'PDF_ANALYSIS_START',
                message: `Starting asynchronous analysis for ${filename} (Job: ${jobId})`,
                correlationId,
                tenantId,
                details: { entityId, userId }
            });

            // Reporter function that bridges domain events to BullMQ/SSE
            const progressReporter = async (progress: AnalysisProgress) => {
                await updateProgress(progress.progress);
                
                // Emitting rich telemetry for SSE listeners (Phase 3)
                await logEvento({
                    level: 'INFO',
                    source: 'ANALYSIS_WORKER',
                    action: 'ANALYSIS_STEP_PROGRESS',
                    message: progress.message,
                    correlationId,
                    tenantId,
                    details: { 
                        phase: progress.phase,
                        step: progress.step,
                        status: progress.status,
                        progress: progress.progress
                    }
                });
            };

            // Delegate to Domain Service (Consolidation)
            const result = await TechnicalEntityService.processEntityAnalysis({
                entityId,
                fileBuffer,
                filename,
                tenantId,
                industry: industry as IndustryType,
                correlationId,
                fileMd5
            }, progressReporter);

            await logEvento({
                level: 'INFO',
                source: 'ASYNC_LOGIC',
                action: 'PDF_ANALYSIS_SUCCESS',
                message: `Asynchronous analysis completed for ${filename}`,
                correlationId,
                tenantId,
                details: { ...result }
            });

            return result;

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? error.stack : undefined;

            await logEvento({
                level: 'ERROR',
                source: 'ASYNC_LOGIC',
                action: 'PDF_ANALYSIS_FATAL',
                message: `Fatal error in PDF Analysis: ${message}`,
                correlationId,
                tenantId,
                stack
            });

            throw error;
        }
    }
}
