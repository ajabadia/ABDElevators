import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';

/**
 * GET /api/admin/rag/quality
 * Returns aggregated feedback stats per asset for the Quality Heatmap.
 * FASE 266 Hardening
 */
async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('admin:ai:rag-quality', 'read');
        const tenantId = session.user.tenantId;

        const collection = await getTenantCollection('rag_feedback', session as any);

        // Aggregate feedback by assetId
        const pipeline = [
            { $match: { tenantId, assetId: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: "$assetId",
                    filename: { $first: "$documentSource" },
                    totalFeedback: { $sum: 1 },
                    thumbsUp: {
                        $sum: { $cond: [{ $eq: ["$type", "thumbs_up"] }, 1, 0] }
                    },
                    thumbsDown: {
                        $sum: { $cond: [{ $eq: ["$type", "thumbs_down"] }, 1, 0] }
                    },
                    issues: { $push: "$categories" }
                }
            },
            {
                $project: {
                    assetId: "$_id",
                    filename: 1,
                    totalFeedback: 1,
                    negativeRate: {
                        $cond: [
                            { $eq: ["$totalFeedback", 0] },
                            0,
                            { $divide: ["$thumbsDown", "$totalFeedback"] }
                        ]
                    },
                    topIssue: {
                        $arrayElemAt: [{
                            $reduce: {
                                input: "$issues",
                                initialValue: [],
                                in: { $concatArrays: ["$$value", { $ifNull: ["$$this", []] }] }
                            }
                        }, 0]
                    }
                }
            },
            { $sort: { negativeRate: -1 as any } }, // Force type for mongo sort
            { $limit: 20 }
        ];

        const aggregatedData = await collection.aggregate(pipeline);

        return NextResponse.json({
            success: true,
            data: aggregatedData
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_RAG_QUALITY', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, {
    endpoint: 'GET /api/admin/rag/quality',
    thresholdMs: 1500
});
