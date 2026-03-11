import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { connectDB, connectLogsDB } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { TenantIdSchema } from '@/lib/schemas';
import { ragEvaluationRepository } from '@/lib/repositories/RagEvaluationRepository';

/**
 * GET /api/admin/dashboard/now
 * Returns realtime/recent metrics for the "Now Panel" (What's happening right now?).
 * SLA: P95 < 500ms
 */
async function GET_internal(req: NextRequest) {
    let currentTenantId = 'unknown';
    try {
        const session = await requirePermission('tenant:health', 'read');
        const tenantId = TenantIdSchema.parse(session.user.tenantId);
        currentTenantId = tenantId || 'unknown';

        const [db, logsDb] = await Promise.all([
            connectDB(),
            connectLogsDB()
        ]);

        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Parallelize Aggregations
        const [
            ingestProcessingCount,
            ingestFailedToday,
            ingestStats24hRaw,
            ragStats1hRaw,
            feedbackStats1hRaw,
            autopilotActions24h,
            lastAutopilotActionRaw,
            ragLatencyPercentilesRaw,
            repairPipelineCount,
            autopilotBlockedCount
        ] = await Promise.all([
            // 1. Ingest: Processing right now
            db.collection('knowledge_assets').countDocuments({
                tenantId,
                ingestionStatus: 'PROCESSING'
            }),

            // 2. Ingest: Failed today (last 24h)
            db.collection('knowledge_assets').countDocuments({
                tenantId,
                ingestionStatus: 'FAILED',
                updatedAt: { $gte: twentyFourHoursAgo }
            }),

            // 3. Ingest: Success Rate (last 24h)
            db.collection('usage_logs').aggregate([
                { $match: { tenantId, tipo: 'DOCUMENT_INGEST', timestamp: { $gte: twentyFourHoursAgo } } },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]).toArray(),

            // 4. RAG: Latency & Request Count (last 1h)
            db.collection('usage_logs').aggregate([
                { $match: { tenantId, tipo: 'VECTOR_SEARCH', timestamp: { $gte: oneHourAgo } } },
                { $group: { _id: null, avgLatency: { $avg: "$duration" }, total: { $sum: 1 } } }
            ]).toArray(),

            // 5. RAG: Feedback stats (last 1h)
            ragEvaluationRepository.aggregate([
                { $match: { timestamp: { $gte: oneHourAgo } } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        negative: { $sum: { $cond: [{ $lt: ["$metrics.faithfulness", 0.7] }, 1, 0] } }
                    }
                }
            ], { user: session.user } as any),

            // 6. Autopilot: Total actions (last 24h)
            logsDb.collection('application_logs').countDocuments({
                tenantId,
                source: 'OPSPLAYBOOK',
                timestamp: { $gte: twentyFourHoursAgo }
            }),

            // 7. Autopilot: Last action label
            logsDb.collection('application_logs').find(
                { tenantId, source: 'OPSPLAYBOOK' }
            ).sort({ timestamp: -1 }).limit(1).toArray(),

            // 8. Phase 299: p95 latency (sorted durations, pick 95th percentile)
            db.collection('usage_logs').aggregate([
                { $match: { tenantId, tipo: 'VECTOR_SEARCH', timestamp: { $gte: oneHourAgo }, duration: { $exists: true } } },
                { $sort: { duration: 1 } },
                { $group: { _id: null, durations: { $push: "$duration" } } }
            ]).toArray(),

            // 9. Phase 299: Repair pipeline (assets in PARTIAL, STOREDNOINDEX, INDEXEDNOSTORAGE states)
            db.collection('knowledge_assets').countDocuments({
                tenantId,
                ingestionStatus: { $in: ['PARTIAL', 'STOREDNOINDEX', 'INDEXEDNOSTORAGE'] }
            }),

            // 10. Phase 299: Blocked autopilot actions (last 24h)
            logsDb.collection('application_logs').countDocuments({
                tenantId,
                source: 'OPSPLAYBOOK',
                level: 'WARN',
                timestamp: { $gte: twentyFourHoursAgo }
            })
        ]);

        const ingestStats24h = ingestStats24hRaw as any[];
        const ragStats1h = ragStats1hRaw as any[];
        const feedbackStats1h = feedbackStats1hRaw as any[];
        const lastAutopilotAction = lastAutopilotActionRaw as any[];
        const ragLatencyPercentiles = ragLatencyPercentilesRaw as any[];

        // ---- Calculate Derived Metrics ----

        // Ingest Success Rate
        const ingestSuccesses = ingestStats24h.find((s: any) => s._id === 'SUCCESS')?.count || 0;
        const totalIngests = ingestStats24h.reduce((acc: number, s: any) => acc + s.count, 0);
        const ingestPercent = totalIngests > 0 ? (ingestSuccesses / totalIngests) * 100 : 100;

        // RAG Feedback Rate
        const fbTotal = feedbackStats1h[0]?.total || 0;
        const fbNegative = feedbackStats1h[0]?.negative || 0;
        const negativeFeedbackRate = fbTotal > 0 ? (fbNegative / fbTotal) * 100 : 0;

        // Autopilot
        const lastActionObj = lastAutopilotAction[0];
        const lastActionLabel = lastActionObj ? lastActionObj.message : "Sin acciones recientes";

        // Phase 299: Calculate p95 latency
        const durations = ragLatencyPercentiles[0]?.durations || [];
        const p95Index = Math.floor(durations.length * 0.95);
        const p95Latency = durations.length > 0 ? durations[p95Index] || durations[durations.length - 1] : 0;

        return NextResponse.json({
            success: true,
            ingest: {
                processing: ingestProcessingCount,
                failedToday: ingestFailedToday,
                successRate: ingestPercent,
                repairPipeline: repairPipelineCount
            },
            rag: {
                latencyMs: ragStats1h[0]?.avgLatency || 0,
                p95LatencyMs: p95Latency,
                requestsLastHour: ragStats1h[0]?.total || 0,
                negativeFeedbackRate
            },
            autopilot: {
                actionsLast24h: autopilotActions24h,
                blockedLast24h: autopilotBlockedCount,
                lastActionLabel
            }
        });

    } catch (error: unknown) {
        console.error(`[NOW_PANEL_ERROR] tenantId: ${currentTenantId}`, error);
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message }, { status: 500 });
    }
}

export const GET = withPerformanceSLA(GET_internal, {
    endpoint: 'GET /api/admin/dashboard/now',
    thresholdMs: 500
});
