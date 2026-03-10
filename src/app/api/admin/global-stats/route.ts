import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { connectDB, connectAuthDB, connectLogsDB } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { DashboardService } from '@/services/admin/dashboard-service';

/**
 * GET /api/admin/global-stats
 * Devuelve métricas globales de toda la plataforma (Solo SUPER_ADMIN).
 * SLA: P95 < 500ms
 */
async function GET_internal(req: NextRequest) {
    try {
        // const session = await requirePermission('platform:metrics', 'read');

        const data = await DashboardService.getGlobalStats();

        return NextResponse.json({
            success: true,
            global: data
        });

    } catch (error: unknown) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, message).toJSON(), { status: 500 });
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/global-stats', thresholdMs: 500 });
