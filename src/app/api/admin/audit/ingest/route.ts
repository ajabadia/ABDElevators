import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { connectLogsDB } from '@/lib/db';
import { handleApiError, ValidationError } from '@/lib/errors';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';

// Schema para validación de queries
const QuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(50),
    page: z.coerce.number().min(1).default(1),
    tenantId: z.string().optional(),
    performedBy: z.string().optional(),
});

export const dynamic = 'force-dynamic';

async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_AUDIT_INGEST', action: 'FETCH_INGEST_AUDIT' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('audit:ingest', 'read');

                const url = new URL(req.url);
                const query = QuerySchema.parse({
                    limit: url.searchParams.get('limit'),
                    page: url.searchParams.get('page'),
                    tenantId: url.searchParams.get('tenantId'),
                    performedBy: url.searchParams.get('performedBy'),
                });

                // FIXED: Reading from LOGS cluster
                const db = await connectLogsDB();
                const collection = db.collection('audit_ingestion');

                const filter: any = {};

                // Phase 254: Enforce 1h safe time window by default
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                filter.timestamp = { $gte: oneHourAgo };

                if (query.tenantId) filter.tenantId = query.tenantId;
                if (query.performedBy) filter.performedBy = { $regex: query.performedBy, $options: 'i' };

                // Restricción de tenant para no-superadmin
                if (session.user.role !== 'SUPER_ADMIN') {
                    const userTenant = session.user.tenantId;
                    if (userTenant) {
                        filter.tenantId = userTenant;
                    }
                }

                const skip = (query.page - 1) * query.limit;

                const [data, total] = await Promise.all([
                    collection.find(filter)
                        .sort({ timestamp: -1 })
                        .skip(skip)
                        .limit(query.limit)
                        .toArray(),
                    collection.countDocuments(filter)
                ]);

                await log({
                    message: 'Successfully retrieved ingestion audit logs',
                    details: { count: data.length, total, page: query.page }
                });

                return NextResponse.json({
                    data,
                    meta: {
                        total,
                        page: query.page,
                        limit: query.limit,
                        pages: Math.ceil(total / query.limit)
                    }
                });

            } catch (error: unknown) {
                if (error instanceof z.ZodError) {
                    return handleApiError(new ValidationError('Validation Failed', error.issues), 'API_ADMIN_AUDIT_INGEST_VAL', correlationId);
                }
                return handleApiError(error, 'API_ADMIN_AUDIT_INGEST', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/audit/ingest', thresholdMs: 10000 });
