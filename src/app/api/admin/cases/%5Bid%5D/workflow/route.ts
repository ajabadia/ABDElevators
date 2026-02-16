import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';
import { AppError, handleApiError, NotFoundError } from '@/lib/errors';
import { WorkflowService } from '@/lib/workflow-service';
import { WorkflowLLMNodeService } from '@/lib/workflow-llm-node-service';
import { LegacyCaseWorkflowEngine as WorkflowEngine } from '@/lib/workflow-engine';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@/types/roles';
import { z } from 'zod';

/**
 * GET /api/admin/cases/[id]/workflow
 * Obtiene el estado actual, definición y análisis IA del caso.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const correlationId = uuidv4();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TECHNICAL, UserRole.REVIEWER]);

        const { id } = params;
        const tenantId = session.user.tenantId;

        // 1. Obtener el caso
        const casesCollection = await getTenantCollection<any>('entities', session);
        const caso = await casesCollection.findOne({ _id: new ObjectId(id) });
        if (!caso) throw new NotFoundError('Caso no encontrado');

        // 2. Obtener el workflow activo para este tipo de entidad
        const workflow = await WorkflowService.getActiveWorkflow(tenantId, caso.entityType || 'ENTITY', caso.environment || 'PRODUCTION');

        // 3. Obtener el estado actual dentro del workflow
        const currentState = workflow?.states.find(s => s.id === caso.status);
        const availableTransitions = workflow?.transitions.filter(t => t.from === caso.status) || [];

        return NextResponse.json({
            success: true,
            status: caso.status,
            workflow,
            currentState,
            availableTransitions,
            lastAnalysis: caso.metadata?.ai_analysis
        });

    } catch (error) {
        return handleApiError(error, 'API_CASE_WORKFLOW_GET', correlationId);
    }
}

/**
 * PATCH /api/admin/cases/[id]/workflow
 * Ejecuta el análisis IA (LLM Node) para el estado actual.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const correlationId = uuidv4();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TECHNICAL, UserRole.REVIEWER]);

        const { id } = params;
        const tenantId = session.user.tenantId;

        // 1. Obtener caso y workflow
        const casesCollection = await getTenantCollection<any>('entities', session);
        const caso = await casesCollection.findOne({ _id: new ObjectId(id) });
        if (!caso) throw new NotFoundError('Caso no encontrado');

        const workflow = await WorkflowService.getActiveWorkflow(tenantId, caso.entityType || 'ENTITY', caso.environment || 'PRODUCTION');
        const currentState = workflow?.states.find(s => s.id === caso.status);

        if (!currentState?.llmNode?.enabled) {
            throw new AppError('VALIDATION_ERROR', 400, 'El estado actual no tiene habilitado el análisis IA.');
        }

        // 2. Ejecutar Nodo LLM
        const analysis = await WorkflowLLMNodeService.runNode({
            tenantId,
            caseId: id,
            stateId: caso.status,
            llmNodeConfig: currentState.llmNode,
            caseContext: caso,
            correlationId
        });

        // 3. Guardar resultado en el caso
        await casesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { 'metadata.ai_analysis': analysis, updatedAt: new Date() } }
        );

        return NextResponse.json({ success: true, analysis });

    } catch (error) {
        return handleApiError(error, 'API_CASE_WORKFLOW_ANALYZE', correlationId);
    }
}

/**
 * POST /api/admin/cases/[id]/workflow
 * Ejecuta una transición de estado.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const correlationId = uuidv4();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TECHNICAL, UserRole.REVIEWER]);

        const { id } = params;
        const { toState, comment, signature } = z.object({
            toState: z.string(),
            comment: z.string().optional(),
            signature: z.string().optional()
        }).parse(await req.json());

        // Usar el motor para ejecutar la transición
        const result = await WorkflowEngine.executeTransition({
            caseId: id,
            toState,
            role: session.user.role as string,
            correlationId,
            comment,
            signature
        });

        return NextResponse.json(result);

    } catch (error) {
        return handleApiError(error, 'API_CASE_WORKFLOW_TRANSITION', correlationId);
    }
}
