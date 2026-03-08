import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

export const dynamic = 'force-dynamic';

async function GET_internal(request: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

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

        await logEvento({
            level: 'INFO',
            source: 'API_REPORTS',
            action: 'LIST_REPORTS',
            correlationId,
            message: 'Reports list fetched',
            details: { count: data.length, total, duration: Date.now() - start }
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
        console.error('Error listing reports:', error);

        await logEvento({
            level: 'ERROR',
            source: 'API_REPORTS',
            action: 'LIST_REPORTS_ERROR',
            correlationId,
            message: 'Error fetching reports',
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });

        if (error instanceof AppError) {
            return NextResponse.json(
                { code: error.code, message: error.message },
                { status: error.status }
            );
        }

        const message = error instanceof Error ? error.message : 'Failed to list reports';
        return NextResponse.json(
            { code: 'INTERNAL_ERROR', message },
            { status: 500 }
        );
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/reports', thresholdMs: 1000 });
