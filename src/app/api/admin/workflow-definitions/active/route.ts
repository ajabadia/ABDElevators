import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { WorkflowService } from '@/services/ops/WorkflowService';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * API para obtener la definición de workflow activa.
 * Fase 7.2: Motor de Workflows Multinivel.
 */
async function GET_internal (request: NextRequest) {
    const correlationId = crypto.randomUUID();
    const { searchParams } = new URL(request.url);
    const rawType = searchParams.get('entityType') || searchParams.get('entity_type');

    let entityType: 'ENTITY' | 'EQUIPMENT' | 'USER' = 'ENTITY';
    if (rawType === 'PEDIDO') entityType = 'ENTITY';
    else if (rawType === 'EQUIPO') entityType = 'EQUIPMENT';
    else if (rawType === 'USUARIO') entityType = 'USER';
    else if (['ENTITY', 'EQUIPMENT', 'USER'].includes(rawType || '')) entityType = rawType as any;

    try {
        const session = await requirePermission('workflow', 'read');

        const definition = await WorkflowService.getActiveWorkflow(session.user.tenantId, entityType);

        if (!definition) {
            return NextResponse.json({ success: true, definition: null, seeded: false });
        }

        return NextResponse.json({ success: true, definition });

    } catch (error: unknown) {
        return handleApiError(error, 'API_GET_ACTIVE_WORKFLOW', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/workflow-definitions/active', thresholdMs: 1000 });
