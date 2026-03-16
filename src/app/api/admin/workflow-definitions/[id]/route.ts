import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { WorkflowService } from '@/services/ops/WorkflowService';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import { WorkflowDefinitionSchema } from '@/lib/schemas/workflow';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * API para gestionar una definición de workflow específica.
 * Fase 127: Orquestación Inteligente.
 */
async function GET_internal (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_WORKFLOW', action: 'FETCH' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('workflow', 'read');
                const { id } = await params;

                const definition = await WorkflowService.getDefinitionById(id);

                if (!definition) {
                    return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 });
                }

                // Verify tenant ownership
                const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
                if (!isSuperAdmin && definition.tenantId !== session.user.tenantId) {
                    await log({
                        level: 'WARN',
                        message: `Unauthorized attempt to access workflow ${id} by tenant ${session.user.tenantId}`,
                        details: { workflowTenant: definition.tenantId, userTenant: session.user.tenantId }
                    });
                    return NextResponse.json({ success: false, error: 'FORBIDDEN' }, { status: 403 });
                }

                await log({
                    message: `Successfully retrieved workflow definition ${id}`,
                    details: { id, name: (definition as any).name }
                });

                return NextResponse.json({ success: true, definition });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_WORKFLOW_GET', correlationId);
            }
        }
    );
}

async function PATCH_internal (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_WORKFLOW', action: 'UPDATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('workflow', 'manage');
                const { id } = await params;
                const body = WorkflowDefinitionSchema.partial().parse(await request.json());

                // Enforce the ID from the URL and the tenant from the session
                const updatedDefinition = {
                    ...body,
                    _id: id,
                    tenantId: session.user.tenantId
                } as any;

                const result = await WorkflowService.createOrUpdateDefinition(updatedDefinition, correlationId);

                await log({
                    message: `Workflow definition ${id} updated`,
                    details: { id, tenantId: session.user.tenantId, updatedBy: session.user.email }
                });

                return NextResponse.json({ success: true, result });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_WORKFLOW_PATCH', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/workflow-definitions/[id]', thresholdMs: 1000 });

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/admin/workflow-definitions/[id]', thresholdMs: 1000 });
