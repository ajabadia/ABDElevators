import { NextRequest, NextResponse } from 'next/server';
import { WorkflowService } from '@/services/ops/WorkflowService';
import { enforcePermission } from '@/lib/guardian-guard';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { WorkflowDefinitionSchema } from '@/lib/schemas/workflow';
import { z } from 'zod';

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
export const GET = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('ai_governance', 'read');

        const { searchParams } = new URL(req.url);
        const validated = ListDefinitionsSchema.parse(Object.fromEntries(searchParams));

        const definitions = await WorkflowService.listDefinitions({
            tenantId: session.user.tenantId,
            entityType: validated.entityType,
            environment: validated.environment,
            limit: validated.limit,
            after: validated.after
        }, session as any);

        const nextCursor = (definitions as any).nextCursor;
        return NextResponse.json({ definitions, nextCursor });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_WORKFLOW_LIST', correlationId);
    }
}, { endpoint: 'API_ADMIN_WORKFLOW_LIST', thresholdMs: 500 });

/**
 * POST /api/admin/workflow-definitions
 * Crea o actualiza definiciones con validación robusta.
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('ai_governance', 'write');
        const body = await req.json();

        const validated = WorkflowDefinitionSchema.parse({
            ...body,
            tenantId: session.user.tenantId
        });

        // El WorkflowService ya maneja la lógica de negocio y transacciones
        const resultId = await WorkflowService.createOrUpdateDefinition(validated, correlationId, session as any);

        return NextResponse.json({ success: true, definitionId: resultId });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_WORKFLOW_SAVE', correlationId);
    }
}
