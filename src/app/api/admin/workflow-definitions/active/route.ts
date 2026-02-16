import { NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/workflow-service';
import { requireRole } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@/types/roles';

/**
 * API para obtener la definición de workflow activa.
 * Fase 7.2: Motor de Workflows Multinivel.
 */
export async function GET(request: Request) {
    const correlationId = uuidv4();
    const { searchParams } = new URL(request.url);
    const rawType = searchParams.get('entityType') || searchParams.get('entity_type');

    let entityType: 'ENTITY' | 'EQUIPMENT' | 'USER' = 'ENTITY';
    if (rawType === 'PEDIDO') entityType = 'ENTITY';
    else if (rawType === 'EQUIPO') entityType = 'EQUIPMENT';
    else if (rawType === 'USUARIO') entityType = 'USER';
    else if (['ENTITY', 'EQUIPMENT', 'USER'].includes(rawType || '')) entityType = rawType as any;

    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TECHNICAL, UserRole.REVIEWER, UserRole.SUPPORT]);

        const definition = await WorkflowService.getActiveWorkflow(session.user.tenantId, entityType);

        if (!definition) {
            return NextResponse.json({ success: true, definition: null, seeded: false });
        }

        return NextResponse.json({ success: true, definition });

    } catch (error) {
        return handleApiError(error, 'API_GET_ACTIVE_WORKFLOW', correlationId);
    }
}
