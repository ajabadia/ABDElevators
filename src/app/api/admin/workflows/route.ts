import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { workflowDefinitionRepository } from '@/lib/repositories/WorkflowDefinitionRepository';
import { AppError, handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { z } from 'zod';
import { WorkflowService } from '@/services/ops/WorkflowService';
import { logEvento } from '@/lib/logger';

const WorkflowSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    nodes: z.array(z.any()), // React Flow nodes
    edges: z.array(z.any()), // React Flow edges
    active: z.boolean().default(true),
    environment: z.enum(['PRODUCTION', 'STAGING', 'SANDBOX']).optional().default('PRODUCTION'),
    version: z.number().optional().default(1),
    industry: z.string().optional().default('ELEVATORS')
});

const ListWorkflowsSchema = z.object({
    environment: z.enum(['PRODUCTION', 'STAGING', 'SANDBOX']).default('PRODUCTION'),
    limit: z.coerce.number().min(1).max(100).default(50),
    after: z.string().optional().nullable()
});

/**
 * GET /api/admin/workflows
 * Lista flujos visuales con validación y SLA.
 */
export const GET = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('ai_governance', 'read');

        const { searchParams } = new URL(req.url);
        const validated = ListWorkflowsSchema.parse(Object.fromEntries(searchParams));

        const items = await WorkflowService.listDefinitions({
            tenantId: session.user.tenantId,
            entityType: 'ENTITY',
            environment: validated.environment,
            limit: validated.limit,
            after: validated.after
        }, session as any);

        const nextCursor = (items as any).nextCursor;
        return NextResponse.json({ success: true, items, nextCursor });
    } catch (error) {
        return handleApiError(error, 'API_WORKFLOWS_GET', correlationId);
    }
}, { endpoint: 'API_WORKFLOWS_GET', thresholdMs: 500 });

/**
 * POST /api/admin/workflows
 * Guarda flujos visuales con compilación y versionado.
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('ai_governance', 'write');

        const body = await req.json();
        const validated = WorkflowSchema.parse(body);
        const tenantId = session.user.tenantId;

        const collection = await (workflowDefinitionRepository as any).getCollection(session as any);

        const visibleGraph = {
            nodes: validated.nodes,
            edges: validated.edges
        };

        let executableLogic: Record<string, unknown> | null = null;
        let compilationError: string | null = null;

        try {
            const { compileGraphToLogic } = await import('@/lib/workflow-compiler');
            executableLogic = compileGraphToLogic(validated.nodes, validated.edges, validated.name, tenantId) as any;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Unknown compilation error';
            await logEvento({
                level: 'WARN',
                source: 'API_ADMIN_WORKFLOWS_POST',
                action: 'COMPILATION_WARNING',
                message: 'Workflow Compilation Failed',
                correlationId,
                details: { error: msg }
            });
            compilationError = msg;
        }

        // Optimized Update with Version Check (Optimistic Locking)
        const query: any = { name: validated.name, tenantId, environment: validated.environment };

        // If it's an update (not first creation), we check the version
        if (validated.version > 1) {
            query.version = validated.version;
        }

        const result = await collection.updateOne(
            query,
            {
                $set: {
                    name: validated.name,
                    active: validated.active,
                    tenantId,
                    environment: validated.environment,
                    industry: validated.industry,
                    entityType: 'ENTITY',
                    visual: visibleGraph,
                    executable: executableLogic,
                    compilationError: compilationError,
                    updatedAt: new Date(),
                    updatedBy: session.user.email
                },
                $inc: { version: 1 },
                $setOnInsert: {
                    createdAt: new Date(),
                    createdBy: session.user.email
                }
            },
            { upsert: true }
        );

        if (result.matchedCount === 0 && validated.version > 1) {
            throw new AppError('CONFLICT', 409, 'Optimistic locking failure: The workflow has been modified by another user.');
        }

        return NextResponse.json({
            success: true,
            id: result.upsertedId || 'updated',
            compiled: !!executableLogic,
            warning: compilationError
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_WORKFLOWS_POST', correlationId);
    }
}
