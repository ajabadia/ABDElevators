import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { connectDB, connectLogsDB } from '@/lib/db';
import { AppError } from '@/lib/errors';

/**
 * GET /api/admin/dashboard/now
 * Returns realtime/recent metrics for the "Now Panel" (What's happening right now?).
 * SLA: P95 < 500ms
 */
async function GET_internal(req: NextRequest) {
    let currentTenantId = 'unknown';
    try {
        const session = await enforcePermission('tenant:health', 'read');
        const tenantId = session.user.tenantId;
        currentTenantId = tenantId || 'unknown';

        if (!tenantId) {
            throw new AppError('VALIDATION_ERROR', 400, 'Tenant ID not found in session');
        }

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
            ingestStats24h,
            ragStats1h,
            feedbackStats1h,
            autopilotActions24h,
            lastAutopilotAction
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

            // 5. RAG: Feedback stats (last 1h) - dummy placeholder for true structure / rag_evaluations
            db.collection('rag_evaluations').aggregate([
                { $match: { tenantId, createdAt: { $gte: oneHourAgo } } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        negative: { $sum: { $cond: [{ $lt: ["$faithfulness_score", 0.7] }, 1, 0] } }
                    }
                }
            ]).toArray(),

            // 6. Autopilot: Total actions (last 24h)
            logsDb.collection('application_logs').countDocuments({
                tenantId,
                source: 'OPSPLAYBOOK', // or AutoOps
                timestamp: { $gte: twentyFourHoursAgo }
            }),

            // 7. Autopilot: Last action label
            logsDb.collection('application_logs').find(
                { tenantId, source: 'OPSPLAYBOOK' } // or AutoOps
            ).sort({ timestamp: -1 }).limit(1).toArray()
        ]);

        // ---- Calculate Derived Metrics ----

        // Ingest Success Rate
        const ingestSuccesses = ingestStats24h.find(s => s._id === 'SUCCESS')?.count || 0;
        const totalIngests = ingestStats24h.reduce((acc, s) => acc + s.count, 0);
        const ingestPercent = totalIngests > 0 ? (ingestSuccesses / totalIngests) * 100 : 100;

        // RAG Feedback Rate
        const fbTotal = feedbackStats1h[0]?.total || 0;
        const fbNegative = feedbackStats1h[0]?.negative || 0;
        const negativeFeedbackRate = fbTotal > 0 ? (fbNegative / fbTotal) * 100 : 0;

        // Autopilot
        const lastActionObj = lastAutopilotAction[0];
        const lastActionLabel = lastActionObj ? lastActionObj.message : "Sin acciones recientes";

        return NextResponse.json({
            success: true,
            ingest: {
                processing: ingestProcessingCount,
                failedToday: ingestFailedToday,
                successRate: ingestPercent
            },
            rag: {
                latencyMs: ragStats1h[0]?.avgLatency || 0,
                requestsLastHour: ragStats1h[0]?.total || 0,
                negativeFeedbackRate
            },
            autopilot: {
                actionsLast24h: autopilotActions24h,
                lastActionLabel
            }
        });

    } catch (error: unknown) {
        console.error(`[NOW_PANEL_ERROR] tenantId: ${currentTenantId}`, error);
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, message).toJSON(), { status: 500 });
    }
}

export const GET = withPerformanceSLA(GET_internal, {
    endpoint: 'GET /api/admin/dashboard/now',
    thresholdMs: 500
});
