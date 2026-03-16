import { NextRequest, NextResponse } from 'next/server';
import { WorkflowService } from '@/services/ops/WorkflowService';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { WorkflowDefinitionSchema } from '@/lib/schemas/workflow';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';

const ListDefinitionsSchema = z.object({
    environment: z.enum(['PRODUCTION', 'STAGING', 'SANDBOX']).default('PRODUCTION'),
    entityType: z.enum(['ENTITY', 'EQUIPMENT', 'USER']).optional().default('ENTITY'),
    limit: z.coerce.number().min(1).max(100).default(50),
    after: z.string().optional().nullable()
});

/**
 * GET /api/admin/workflow-definitions
 * Lista definiciones con validación robusta y SLA.
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_WORKFLOW_DEFS', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('ai_governance', 'read');

                const { searchParams } = new URL(req.url);
                const validated = ListDefinitionsSchema.parse(Object.fromEntries(searchParams));

                const definitions = await WorkflowService.listDefinitions({
                    tenantId: session.user.tenantId,
                    entityType: validated.entityType,
                    environment: validated.environment,
                    limit: validated.limit,
                    after: validated.after
                }, session as any);

                await log({
                    message: `Retrieved ${definitions.length} definitions`,
                    details: { entityType: validated.entityType, environment: validated.environment }
                });

                const nextCursor = (definitions as any).nextCursor;
                return NextResponse.json({ definitions, nextCursor });

            } catch (error) {
                return handleApiError(error, 'API_ADMIN_WORKFLOW_LIST', correlationId);
            }
        }
    );
}

/**
 * POST /api/admin/workflow-definitions
 * Crea o actualiza definiciones con validación robusta.
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_WORKFLOW_DEFS', action: 'SAVE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('ai_governance', 'write');
                const body = await req.json();

                const validated = WorkflowDefinitionSchema.parse({
                    ...body,
                    tenantId: session.user.tenantId
                });

                // El WorkflowService ya maneja la lógica de negocio y transacciones
                const resultId = await WorkflowService.createOrUpdateDefinition(validated, correlationId, session as any);

                await log({
                    message: `Workflow definition saved: ${validated.name}`,
                    details: { definitionId: resultId, tenantId: session.user.tenantId }
                });

                return NextResponse.json({ success: true, definitionId: resultId });

            } catch (error) {
                return handleApiError(error, 'API_ADMIN_WORKFLOW_SAVE', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'API_ADMIN_WORKFLOW_LIST', thresholdMs: 500 });
export const POST = withPerformanceSLA(POST_internal, { endpoint: 'API_ADMIN_WORKFLOW_SAVE', thresholdMs: 1000 });
