import { NextRequest, NextResponse } from 'next/server';
import { logEvento } from '@abd/platform-core/server';

/**
 * GET /api/cron/feedback-scoring
 * Cron-safe endpoint to process pending RAG feedback and update chunk scores.
 * Protected by CRON_SECRET header. Designed for Vercel Cron Jobs.
 * 
 * Schedule: Once per night (e.g., 0 3 * * * via vercel.json cron config)
 * 
 * FASE 299: Industrialization & Persistence
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        // 🛡️ SECURITY: Validate cron secret
        const authHeader = req.headers.get('authorization');
        const expectedSecret = process.env.CRON_SECRET;

        if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
            await logEvento({
                level: 'WARN',
                source: 'CRON_FEEDBACK_SCORING',
                action: 'UNAUTHORIZED_ATTEMPT',
                message: 'Unauthorized cron invocation attempt',
                correlationId,
                details: { ip: req.headers.get('x-forwarded-for') || 'unknown' }
            });
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Dynamic import to avoid cold-start overhead when not invoked
        const { RagFeedbackProcessor } = await import('@/services/core/rag/rag-feedback-processor');

        await logEvento({
            level: 'INFO',
            source: 'CRON_FEEDBACK_SCORING',
            action: 'JOB_STARTED',
            message: 'Feedback scoring job initiated',
            correlationId
        });

        const result = await RagFeedbackProcessor.processPendingFeedback(correlationId);

        const durationMs = Date.now() - start;

        await logEvento({
            level: 'INFO',
            source: 'CRON_FEEDBACK_SCORING',
            action: 'JOB_COMPLETED',
            message: `Feedback scoring completed: ${result.processed} processed, ${result.failures} failures`,
            correlationId,
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
        const errorStack = error instanceof Error ? error.stack : undefined;

        await logEvento({
            level: 'ERROR',
            source: 'CRON_FEEDBACK_SCORING',
            action: 'JOB_FAILED',
            message: `Feedback scoring job failed: ${errorMessage}`,
            correlationId,
            details: { error: errorMessage },
            stack: errorStack
        });

        return NextResponse.json({
            success: false,
            error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal error'
        }, { status: 500 });
    }
}
