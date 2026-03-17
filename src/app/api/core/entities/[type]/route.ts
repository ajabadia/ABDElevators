import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { Entity, TenantIdSchema } from '@/lib/schemas';
import { type SafeFilter } from '@/lib/repositories/BaseRepository';

const entityTypes = ['ORDER', 'WORKSHOP_ORDER', 'TECHNICAL_DOCUMENT', 'CERTIFICATE'] as const;

/**
 * 🛰️ ERA 12: QUERY SCHEMA
 */
const QueryParamsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional().default(''),
    status: z.string().optional()
});

/**
 * GET /api/core/entities/[type]
 * List of entities by type for the current tenant.
 */
export const GET = withPerformanceSLA(async (req: NextRequest, context: { params: Promise<{ type: string }> }) => {
    return withCorrelation(
        { level: 'INFO', source: 'API_CORE_ENTITIES_LIST', action: 'LIST_ENTITIES' },
        async ({ log, correlationId }) => {
            try {
                const { searchParams } = new URL(req.url);
                const validated = QueryParamsSchema.parse(Object.fromEntries(searchParams));

                const rawParams = await context.params;
                const typeAlias = rawParams.type.toUpperCase();

                // Mapping friendly URL segment to DB type
                const dbType = typeAlias === 'ORDERS' || typeAlias === 'ORDER' 
                    ? 'WORKSHOP_ORDER' 
                    : typeAlias;

                const { page, limit, search, status } = validated;
                // Enforce generic read access for the specific type via ABAC. 
                // Example: resource='entities', action='read' or more granular like resource='entity:workshop_order'
                const session = await requirePermission('entities', 'read');
                const tenantId = TenantIdSchema.parse(session.user.tenantId);

                const collection = await getTenantCollection<Entity>('orders', session, 'MAIN');

                const filter: SafeFilter<Entity> = { tenantId, status: { $ne: 'deleted' } as any, type: dbType as any };

                if (search) {
                    filter.$or = [
                        { identifier: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } }
                    ];
                }
                if (status) {
                    filter.status = status;
                }

                const skip = (page - 1) * limit;

                const [entities, total] = await Promise.all([
                    collection.find(filter, {
                        sort: { createdAt: -1 },
                        skip,
                        limit
                    }),
                    collection.countDocuments(filter)
                ]);

                return NextResponse.json({
                    success: true,
                    entities,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit)
                    },
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_CORE_ENTITIES_LIST_GET', correlationId);
            }
        }
    );
}, { endpoint: 'GET /api/core/entities/[type]', thresholdMs: 500 });
