import crypto from 'crypto';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { WorkflowService } from '@/services/ops/WorkflowService';
import { enforcePermission } from '@/lib/guardian-guard';
import { handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import { WorkflowDefinitionSchema } from '@/lib/schemas/workflow';

/**
 * API para gestionar una definición de workflow específica.
 * Fase 127: Orquestación Inteligente.
 */
async function GET_internal (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('workflow', 'read');
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

    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_WORKFLOW_GET', correlationId);
    }
}

async function PATCH_internal (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('workflow', 'manage');
        const { id } = await params;
        const body = WorkflowDefinitionSchema.partial().parse(await request.json());

        // Enforce the ID from the URL and the tenant from the session
        const updatedDefinition = {
            ...body,
            _id: id,
            tenantId: session.user.tenantId
            // Rule #11: tenantId isolation ensured here
        } as any;

        const result = await WorkflowService.createOrUpdateDefinition(updatedDefinition, correlationId);

        return NextResponse.json({ success: true, result });

    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_WORKFLOW_PATCH', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/workflow-definitions/[id]', thresholdMs: 1000 });

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/admin/workflow-definitions/[id]', thresholdMs: 1000 });
