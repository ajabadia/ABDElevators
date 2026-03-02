import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';
import { AppError, handleApiError, NotFoundError } from '@/lib/errors';
import { WorkflowService } from '@/services/ops/WorkflowService';
import { WorkflowLLMNodeService } from '@/services/ops/WorkflowLLMNodeService';
import { CaseWorkflowEngine as WorkflowEngine } from '@abd/workflow-engine/server';
import { UserRole } from '@/types/roles';
import { z } from 'zod';

/**
 * GET /api/admin/cases/[id]/workflow
 * Obtiene el estado actual, definición y análisis IA del caso.
 */
async function GET_internal (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('case', 'read');

        const { id } = await params;
        const tenantId = session.user.tenantId;

        // 1. Obtener el caso
        const casesCollection = await getTenantCollection<any>('entities', session);
        const caso = await casesCollection.findOne({ _id: new ObjectId(id) });
        if (!caso) throw new NotFoundError('Caso no encontrado');

        // 2. Obtener el workflow activo para este tipo de entidad
        const workflow = await WorkflowService.getActiveWorkflow(tenantId, caso.entityType || 'ENTITY', caso.environment || 'PRODUCTION');

        // 3. Obtener el estado actual dentro del workflow
        const currentState = workflow?.states.find((s: any) => s.id === caso.status);
        const availableTransitions = workflow?.transitions.filter((t: any) => t.from === caso.status) || [];

        return NextResponse.json({
            success: true,
            status: caso.status,
            workflow,
            currentState,
            availableTransitions,
            lastAnalysis: caso.metadata?.ai_analysis
        });

    } catch (error: unknown) {
        return handleApiError(error, 'API_CASE_WORKFLOW_GET', correlationId);
    }
}

/**
 * PATCH /api/admin/cases/[id]/workflow
 * Ejecuta el análisis IA (LLM Node) para el estado actual.
 */
async function PATCH_internal (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('case', 'manage');

        const { id } = await params;
        const tenantId = session.user.tenantId;

        // 1. Obtener caso y workflow
        const casesCollection = await getTenantCollection<any>('entities', session);
        const caso = await casesCollection.findOne({ _id: new ObjectId(id) });
        if (!caso) throw new NotFoundError('Caso no encontrado');

        const workflow = await WorkflowService.getActiveWorkflow(tenantId, caso.entityType || 'ENTITY', caso.environment || 'PRODUCTION');
        const currentState = workflow?.states.find((s: any) => s.id === caso.status);

        if (!currentState?.llmNode?.enabled) {
            throw new AppError('VALIDATION_ERROR', 400, 'El estado actual no tiene habilitado el análisis IA.');
        }

        // 2. Ejecutar Nodo LLM
        const analysis = await WorkflowLLMNodeService.runNode({
            tenantId,
            caseId: id,
            stateId: caso.status,
            llmNodeConfig: {
                enabled: currentState.llmNode.enabled,
                promptKey: currentState.llmNode.promptKey || '',
                schemaKey: currentState.llmNode.schemaKey || ''
            } as any,
            caseContext: caso,
            correlationId
        });

        // 3. Guardar resultado en el caso
        await casesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { 'metadata.ai_analysis': analysis, updatedAt: new Date() } }
        );

        return NextResponse.json({ success: true, analysis });

    } catch (error: unknown) {
        return handleApiError(error, 'API_CASE_WORKFLOW_ANALYZE', correlationId);
    }
}

/**
 * POST /api/admin/cases/[id]/workflow
 * Ejecuta una transición de estado.
 */
async function POST_internal (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('case', 'manage');

        const { id } = await params;
        const tenantId = session.user.tenantId;
        const { toState, comment, signature } = z.object({
            toState: z.string(),
            comment: z.string().optional(),
            signature: z.string().optional()
        }).parse(await req.json());

        // Usar el motor para ejecutar la transición
        const result = await WorkflowEngine.getInstance().executeTransition(
            id,
            toState,
            tenantId,
            session.user.id,
            [session.user.role as string],
            correlationId
        );

        return NextResponse.json(result);

    } catch (error: unknown) {
        return handleApiError(error, 'API_CASE_WORKFLOW_TRANSITION', correlationId);
    }
}


export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/cases/[id]/workflow', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/cases/[id]/workflow', thresholdMs: 1000 });

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/admin/cases/[id]/workflow', thresholdMs: 1000 });
