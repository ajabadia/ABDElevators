import { NextRequest, NextResponse } from "next/server";
import { IntelligenceWorker } from "@/services/ops/intelligence-worker";
import { handleApiError } from "@/lib/errors";
import { withCorrelation } from "@/lib/logger/with-correlation";
import { withPerformanceSLA } from "@/lib/interceptors/performance-interceptor";

async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_INTELLIGENCE_WORKER', action: 'TRIGGER' },
        async ({ log, correlationId }) => {
            const { searchParams } = new URL(req.url);
            const action = searchParams.get('action') || 'all';

            try {
                await log({
                    message: `Intelligence worker triggered with action: ${action}`,
                    details: { action }
                });

                const results: any = {};

                // 1. FAQ Generation
                if (action === 'faq' || action === 'all') {
                    results.faq = await IntelligenceWorker.generateFAQsFromPatterns();
                }

                // 2. Retrieval Quality Monitoring
                if (action === 'monitor' || action === 'all') {
                    results.monitor = await IntelligenceWorker.monitorRetrievalQuality();
                }

                await log({
                    message: `Intelligence worker cycle complete`,
                    details: { results }
                });

                return NextResponse.json({
                    success: true,
                    message: 'Intelligence worker cycle complete.',
                    results,
                    metadata: {
                        correlationId
                    }
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_INTELLIGENCE_WORKER_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/workers/intelligence', thresholdMs: 10000 });
