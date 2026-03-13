import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { Filter, ObjectId } from 'mongodb';
import { z } from 'zod';

const entityTypes = ['ORDER', 'WORKSHOP_ORDER', 'TECHNICAL_DOCUMENT', 'CERTIFICATE'] as const;

/**
 * GET /api/core/entities/[type]
 * List of entities by type for the current tenant.
 */
export const GET = withPerformanceSLA(async (req: NextRequest, context: { params: Promise<{ type: string }> }) => {
    const correlationId = crypto.randomUUID();
    const { searchParams } = new URL(req.url);

    const rawParams = await context.params;
    const typeAlias = rawParams.type.toUpperCase();

    // Mapping friendly URL segment to DB type
    const dbType = typeAlias === 'ORDERS' ? 'WORKSHOP_ORDER' :
        typeAlias === 'ORDER' ? 'WORKSHOP_ORDER' : typeAlias;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    try {
        // Enforce generic read access for the specific type via ABAC. 
        // Example: resource='entities', action='read' or more granular like resource='entity:workshop_order'
        const session = await requirePermission('entities', 'read');
        const tenantId = session.user.tenantId;

        const collection = await getTenantCollection('orders', session as any);

        const filter: Filter<any> = { tenantId, type: dbType };

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
        return handleApiError(error, 'API_CORE_ENTITIES_LIST', correlationId);
    }
}, { endpoint: 'GET /api/core/entities/[type]', thresholdMs: 500 });
