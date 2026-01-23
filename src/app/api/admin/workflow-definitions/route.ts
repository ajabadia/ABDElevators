import { NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/workflow-service';
import { auth } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/errors';
import { WorkflowDefinitionSchema } from '@/lib/schemas';
import { v4 as uuidv4 } from 'uuid';

/**
 * API para gestionar definiciones de workflow.
 * Fase 7.2: Motor de Workflows Multinivel.
 */
export async function GET(request: Request) {
    const correlacion_id = uuidv4();
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'No autorizado');
        }

        const { searchParams } = new URL(request.url);
        const entity_type = (searchParams.get('entity_type') as any) || 'PEDIDO';

        const definitions = await WorkflowService.listDefinitions(session.user.tenantId, entity_type);
        return NextResponse.json({ definitions });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_WORKFLOW_LIST', correlacion_id);
    }
}

export async function POST(request: Request) {
    const correlacion_id = uuidv4();
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'No autorizado');
        }

        const body = await request.json();

        // El WorkflowService ya maneja la validación de esquema y lógica de negocio
        const result = await WorkflowService.createOrUpdateDefinition(body, correlacion_id);

        return NextResponse.json({ success: true, definitionId: result });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_WORKFLOW_SAVE', correlacion_id);
    }
}
