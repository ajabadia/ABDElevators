import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new AppError('UNAUTHORIZED', 401, 'No session');
        }

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

    } catch (error) {
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

        return NextResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Failed to list reports' },
            { status: 500 }
        );
    }
}
