import { NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { Filter } from 'mongodb';
import { Entity } from '@/lib/schemas';

/**
 * GET /api/technical/entities
 * List of entities for the current tenant.
 * Supports pagination and basic search.
 * SLA: P95 < 500ms
 */
export const GET = withPerformanceSLA(async (req) => {
    const correlationId = crypto.randomUUID();
    const { searchParams } = new URL(req.url);

    // Search and pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    try {
        const session = await enforcePermission('technical:entities', 'read');
        const tenantId = session.user.tenantId;

        const collection = await getTenantCollection('entities');

        // Build filter
        const filter: Filter<any> = { tenantId };
        if (search) {
            filter.$or = [
                { identifier: { $regex: search, $options: 'i' } },
                { filename: { $regex: search, $options: 'i' } },
                { client: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        // Execute query
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
        return handleApiError(error, 'API_TECHNICAL_ENTITIES_LIST_GET', correlationId);
    }
}, { endpoint: 'GET /api/technical/entities', thresholdMs: 500 });
