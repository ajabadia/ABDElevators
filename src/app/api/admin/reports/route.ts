import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

export const dynamic = 'force-dynamic';

async function GET_internal(request: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_REPORTS', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('reports', 'read');

                const { searchParams } = new URL(request.url);
                const limit = parseInt(searchParams.get('limit') || '20');
                const offset = parseInt(searchParams.get('offset') || '0');
                const type = searchParams.get('type');

                const reports = await getTenantCollection('reports', session);
                const query: any = {};

                if (type) {
                    query.type = type;
                }

                const data = await reports.find(query, {
                    sort: { 'metadata.generatedAt': -1 },
                    limit,
                    skip: offset
                });

                const total = await reports.countDocuments(query);

                await log({
                    message: `Successfully retrieved ${data.length} reports`,
                    details: { count: data.length, total, type, limit, offset }
                });

                return NextResponse.json({
                    data,
                    meta: {
                        total,
                        limit,
                        offset
                    }
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_REPORTS_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/reports', thresholdMs: 1000 });
