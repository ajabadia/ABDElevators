import { NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/workflow-service';
import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@/types/roles';

/**
 * API para gestionar definiciones de workflow (Phase 70 compliance).
 * Fase 7.2: Motor de Workflows Multinivel.
 */
export async function GET(request: Request) {
    const correlationId = uuidv4();
    try {
        // Phase 70: Centralized typed role check
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

        const { searchParams } = new URL(request.url);
        const environment = searchParams.get('environment') || 'PRODUCTION';
        const rawType = searchParams.get('entityType') || searchParams.get('entity_type');
        let entityType: 'ENTITY' | 'EQUIPMENT' | 'USER' = 'ENTITY';
        if (rawType === 'PEDIDO') entityType = 'ENTITY';
        else if (rawType === 'EQUIPO') entityType = 'EQUIPMENT';
        else if (rawType === 'USUARIO') entityType = 'USER';
        else if (['ENTITY', 'EQUIPMENT', 'USER'].includes(rawType || '')) entityType = rawType as any;

        const limit = parseInt(searchParams.get('limit') || '50');
        const after = searchParams.get('after');

        const definitions = await WorkflowService.listDefinitions({
            tenantId: session.user.tenantId,
            entityType,
            environment,
            limit,
            after
        });

        const nextCursor = (definitions as any).nextCursor;
        return NextResponse.json({ definitions, nextCursor });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_WORKFLOW_LIST', correlationId);
    }
}

export async function POST(request: Request) {
    const correlationId = uuidv4();
    try {
        // Phase 70: Centralized typed role check
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

        const body = await request.json();

        // El WorkflowService ya maneja la validación de esquema y lógica de negocio
        const result = await WorkflowService.createOrUpdateDefinition(body, correlationId);

        return NextResponse.json({ success: true, definitionId: result });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_WORKFLOW_SAVE', correlationId);
    }
}
