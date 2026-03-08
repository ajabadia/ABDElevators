import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
export const dynamic = 'force-dynamic';

async function GET_internal(request: NextRequest) {
    const correlationId = crypto.randomUUID();
    const { searchParams } = new URL(request.url);
    const isFull = searchParams.get('full') === 'true';

    const health = {
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    };

    if (!isFull) return NextResponse.json(health);

    try {
        await requirePermission('platform:settings', 'read');
        const db = await connectDB();
        await db.command({ ping: 1 });

        return NextResponse.json({ ...health, checks: { database: 'CONNECTED', environment: process.env.NODE_ENV } });
    } catch (error: unknown) {
        return handleApiError(error, 'HEALTH_CHECK_FULL', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/health', thresholdMs: 1000 });
