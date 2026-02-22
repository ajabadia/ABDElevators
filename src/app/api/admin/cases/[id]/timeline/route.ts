import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth'; // Adjust if using different auth provider
import { UserRole } from '@/types/roles';
import { EntityTimelineService } from '@/services/observability/EntityTimelineService';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

/**
 * GET /api/admin/cases/[id]/timeline
 * Recupera la línea de tiempo unificada para un caso.
 */
async function handler(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // In Next.js 15+ params is a Promise
) {
    const { id } = await params;
    const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

    try {
        // Validación de RBAC (Admin o SuperAdmin)
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

        const tenantId = session.user?.tenantId || 'default_tenant'; // Adjust based on your auth session structure

        const timeline = await EntityTimelineService.getTimeline(id, tenantId);

        return NextResponse.json({
            success: true,
            count: timeline.length,
            data: timeline
        });

    } catch (error: any) {
        // El interceptor SLA ya manejará el log de latencia, pero manejamos errores funcionales
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_TIMELINE',
            action: 'GET_TIMELINE_ERROR',
            message: `Error obteniendo timeline para caso ${id}: ${error.message}`,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        );
    }
}

// Aplicar interceptor de SLA
export const GET = withPerformanceSLA(handler, {
    endpoint: 'GET_CASE_TIMELINE',
    thresholdMs: 500, // SLA: 500ms
    source: 'API_ADMIN'
});
