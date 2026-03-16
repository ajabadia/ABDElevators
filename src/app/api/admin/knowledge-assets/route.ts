import { NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { type KnowledgeAsset } from '@/lib/schemas';
import { EntityIdSchema } from '@abd/platform-core';
import { type Filter } from 'mongodb';
import { withCorrelation } from '@/lib/logger/with-correlation';

const ListAssetsSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.string().optional(),
    q: z.string().optional(),
    spaceId: z.string().optional(),
    spacePath: z.string().optional(),
    scope: z.enum(['all', 'user']).optional().default('all'),
    userId: z.string().optional(),
    reviewStatus: z.string().optional(),
});

/**
 * GET /api/admin/knowledge-assets
 * Proposito: Listado avanzado de activos con filtros y paginación.
 * REGLA #8: P95 < 500ms
 */
async function GET_internal(req: Request) {
    return withCorrelation(
        { level: 'INFO', source: 'API_KNOWLEDGE_ASSETS', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge', 'read');

                const { searchParams } = new URL(req.url);
                const validated = ListAssetsSchema.parse(Object.fromEntries(searchParams));

                const collection = await getTenantCollection<KnowledgeAsset>('knowledge_assets', session as any);

                // Build filter
                const filter: Filter<KnowledgeAsset> = {};

                if (validated.status) {
                    filter.status = validated.status as any;
                }
                if (validated.spaceId) {
                    filter.spaceId = EntityIdSchema.parse(validated.spaceId);
                }
                if (validated.spacePath) {
                    // Prefix search for hierarchical listing: all documents in this space or sub-spaces
                    filter.spacePath = { $regex: `^${validated.spacePath}`, $options: 'i' } as any;
                }
                if (validated.q) {
                    filter.$or = [
                        { filename: { $regex: validated.q, $options: 'i' } },
                        { "source.filename": { $regex: validated.q, $options: 'i' } } as any,
                        { description: { $regex: validated.q, $options: 'i' } } as any
                    ];
                }

                if (validated.reviewStatus) {
                    filter.reviewStatus = validated.reviewStatus as any;
                }

                if (validated.scope === 'user' && validated.userId) {
                    filter.ownerId = EntityIdSchema.parse(validated.userId);
                }

                const skip = (validated.page - 1) * validated.limit;

                // SecureCollection.find already returns an array (Fase 213 standardization)
                const [assets, total] = await Promise.all([
                    collection.find(filter as any, {
                        sort: { createdAt: -1 },
                        skip,
                        limit: validated.limit
                    }),
                    collection.countDocuments(filter)
                ]);

                // Aggregación de medias globales para dashboard
                const statsAggregation = await collection.aggregate([
                    { $match: filter as any },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            active: { $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] } },
                            totalChunks: { $sum: { $ifNull: ["$totalChunks", 0] } },
                            lastIngest: { $max: "$createdAt" }
                        }
                    }
                ]);

                const stats = (statsAggregation as any)[0] || {
                    total: 0,
                    active: 0,
                    totalChunks: 0,
                    lastIngest: null
                };

                await log({
                    message: `Retrieved ${assets.length} knowledge assets`,
                    details: { count: assets.length, total, stats }
                });

                return NextResponse.json({
                    success: true,
                    data: assets,
                    stats,
                    pagination: {
                        total,
                        page: validated.page,
                        limit: validated.limit,
                        pages: Math.ceil(total / validated.limit)
                    }
                });

            } catch (error) {
                return handleApiError(error, 'API_KNOWLEDGE_LIST', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'API_KNOWLEDGE_LIST', thresholdMs: 500 });
