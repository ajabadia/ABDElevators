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
    const correlationId = uuidv4();
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'No autorizado');
        }

        const { searchParams } = new URL(request.url);
        const environment = searchParams.get('environment') || 'PRODUCTION';
        const rawType = searchParams.get('entityType') || searchParams.get('entity_type');
        let entityType: 'ENTITY' | 'EQUIPMENT' | 'USER' = 'ENTITY';
        if (rawType === 'PEDIDO') entityType = 'ENTITY';
        else if (rawType === 'EQUIPO') entityType = 'EQUIPMENT';
        else if (rawType === 'USUARIO') entityType = 'USER';
        else if (['ENTITY', 'EQUIPMENT', 'USER'].includes(rawType || '')) entityType = rawType as any;

        const definitions = await WorkflowService.listDefinitions(session.user.tenantId, entityType, environment);
        return NextResponse.json({ definitions });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_WORKFLOW_LIST', correlationId);
    }
}

export async function POST(request: Request) {
    const correlationId = uuidv4();
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'No autorizado');
        }

        const body = await request.json();

        // El WorkflowService ya maneja la validación de esquema y lógica de negocio
        const result = await WorkflowService.createOrUpdateDefinition(body, correlationId);

        return NextResponse.json({ success: true, definitionId: result });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_WORKFLOW_SAVE', correlationId);
    }
}
