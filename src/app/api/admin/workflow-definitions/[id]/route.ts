import { NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/workflow-service';
import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@/types/roles';
import { WorkflowDefinitionSchema } from '@/lib/schemas/workflow';

/**
 * API para gestionar una definición de workflow específica.
 * Fase 127: Orquestación Inteligente.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = uuidv4();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const { id } = await params;

        const definition = await WorkflowService.getDefinitionById(id);

        if (!definition) {
            return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 });
        }

        // Verify tenant ownership
        const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
        if (!isSuperAdmin && definition.tenantId !== session.user.tenantId) {
            return NextResponse.json({ success: false, error: 'FORBIDDEN' }, { status: 403 });
        }

        return NextResponse.json({ success: true, definition });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_WORKFLOW_GET', correlationId);
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = uuidv4();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const { id } = await params;
        const body = WorkflowDefinitionSchema.partial().parse(await request.json());

        // Enforce the ID from the URL and the tenant from the session
        const updatedDefinition = {
            ...body,
            _id: id,
            tenantId: session.user.tenantId
        } as any;

        const result = await WorkflowService.createOrUpdateDefinition(updatedDefinition, correlationId);

        return NextResponse.json({ success: true, result });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_WORKFLOW_PATCH', correlationId);
    }
}
