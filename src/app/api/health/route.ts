import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * 🏥 Health Hub (ERA 8 Consolidated)
 * Supports Liveness (uptime) and Readiness (DB connection).
 * GET /api/health?full=true
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const isFull = searchParams.get('full') === 'true';

    const health = {
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    };

    if (!isFull) {
        return NextResponse.json(health, { status: 200 });
    }

    try {
        // Readiness Check: MongoDB
        const db = await connectDB();
        await db.command({ ping: 1 });

        return NextResponse.json({
            ...health,
            checks: {
                database: 'CONNECTED',
                environment: process.env.NODE_ENV
            }
        }, { status: 200 });

    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'HEALTH_CHECK',
            action: 'READINESS_FAILED',
            message: error.message,
            details: { error: error.stack }
        });

        return NextResponse.json({
            ...health,
            status: 'DEGRADED',
            checks: {
                database: 'DISCONNECTED',
                error: error.message
            }
        }, { status: 503 });
    }
}
