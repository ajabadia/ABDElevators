import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { EntityTimelineService } from '@/services/observability/EntityTimelineService';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { enforcePermission } from '@/lib/guardian-guard';
import { TenantSession } from '@/lib/db-tenant';

/**
 * GET /api/admin/cases/[id]/timeline
 * Recupera la línea de tiempo unificada para un caso.
 */
async function handler(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

    try {
        // Validación de RBAC (Admin o SuperAdmin) vía Guardian
        const user = await enforcePermission('cases:timeline', 'read');
        const session = user as unknown as TenantSession;

        const tenantId = session.user?.tenantId || 'default';

        const timeline = await EntityTimelineService.getTimeline(id, tenantId, session);

        return NextResponse.json({
            success: true,
            count: timeline.length,
            data: timeline
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_CASE_TIMELINE_GET', correlationId);
    }
}

// Aplicar interceptor de SLA
export const GET = withPerformanceSLA(handler, {
    endpoint: 'GET_CASE_TIMELINE',
    thresholdMs: 1000, // SLA: 1s for aggregation
    source: 'API_ADMIN'
});
