import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';

export const dynamic = 'force-dynamic';

/**
 * 🏥 Health Hub (ERA 8 Consolidated)
 * Supports Liveness (uptime) and Readiness (DB connection).
 * GET /api/health?full=true
 */
async function GET_internal (request: Request) {
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

    // 🛡️ [SECURITY] Restrict full diagnostic to SUPER_ADMIN
    try {
        await requireRole([UserRole.SUPER_ADMIN]);
    } catch (error) {
        return NextResponse.json({
            ...health,
            status: 'UP',
            message: 'Full diagnostics restricted to SUPER_ADMIN'
        }, { status: 200 });
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

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/health', thresholdMs: 1000 });
