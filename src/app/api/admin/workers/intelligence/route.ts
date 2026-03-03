import { NextRequest, NextResponse } from "next/server";
import { IntelligenceWorker } from "@/services/ops/intelligence-worker";
import { AppError, handleApiError } from "@/lib/errors";
import { logEvento } from "@/lib/logger";

export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'all';

    try {
        await logEvento({
            level: 'INFO',
            source: 'API_INTELLIGENCE_WORKER',
            action: 'TRIGGER_WORKER_START',
            message: `Intelligence worker triggered with action: ${action}`,
            correlationId,
            details: { action }
        });

        const start = Date.now();
        const results: any = {};

        // 1. FAQ Generation
        if (action === 'faq' || action === 'all') {
            results.faq = await IntelligenceWorker.generateFAQsFromPatterns();
        }

        // 2. Retrieval Quality Monitoring
        if (action === 'monitor' || action === 'all') {
            results.monitor = await IntelligenceWorker.monitorRetrievalQuality();
        }

        const duration = Date.now() - start;

        await logEvento({
            level: 'INFO',
            source: 'API_INTELLIGENCE_WORKER',
            action: 'TRIGGER_WORKER_COMPLETE',
            message: `Intelligence worker cycle complete in ${duration}ms`,
            correlationId,
            details: { ...results, durationMs: duration }
        });

        return NextResponse.json({
            success: true,
            message: 'Intelligence worker cycle complete.',
            results,
            metadata: {
                durationMs: duration,
                correlationId
            }
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_INTELLIGENCE_WORKER', correlationId);
    }
}
