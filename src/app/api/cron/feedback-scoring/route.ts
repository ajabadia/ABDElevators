import { NextRequest, NextResponse } from 'next/server';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/cron/feedback-scoring
 * Cron-safe endpoint to process pending RAG feedback and update chunk scores.
 */
export async function GET(req: NextRequest) {
    const start = Date.now();

    return await withCorrelation(
        { level: 'INFO', source: 'CRON_FEEDBACK_SCORING', action: 'JOB_EXECUTION' },
        async ({ log, correlationId }) => {
            try {
                // 🛡️ SECURITY: Validate cron secret
                const authHeader = req.headers.get('authorization');
                const expectedSecret = process.env.CRON_SECRET;

                if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
                    await log({
                        level: 'WARN',
                        action: 'UNAUTHORIZED_ATTEMPT',
                        message: 'Unauthorized cron invocation attempt',
                        details: { ip: req.headers.get('x-forwarded-for') || 'unknown' }
                    });
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }

                // Dynamic import to avoid cold-start overhead when not invoked
                const { RagFeedbackProcessor } = await import('@/services/core/rag/rag-feedback-processor');

                await log({
                    action: 'JOB_STARTED',
                    message: 'Feedback scoring job initiated'
                });

                const result = await RagFeedbackProcessor.processPendingFeedback(correlationId);
                const durationMs = Date.now() - start;

                await log({
                    action: 'JOB_COMPLETED',
                    message: `Feedback scoring completed: ${result.processed} processed, ${result.failures} failures`,
                    details: { ...result, durationMs }
                });

                return NextResponse.json({
                    success: true,
                    processed: result.processed,
                    failures: result.failures,
                    durationMs
                });

            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                
                await log({
                    level: 'ERROR',
                    action: 'JOB_FAILED',
                    message: `Feedback scoring job failed: ${errorMessage}`,
                    details: { error: errorMessage }
                });

                return NextResponse.json({
                    success: false,
                    error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal error'
                }, { status: 500 });
            }
        }
    );
}
