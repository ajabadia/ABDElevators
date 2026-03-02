import { NextRequest, NextResponse } from 'next/server';
import { RagExperimentService } from '@/services/core/rag-experiment-service';
import { AppError, handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { z } from 'zod';
import { TenantSession } from '@/lib/db-tenant';

const ExperimentRequestSchema = z.object({
    query: z.string().min(1),
    config: z.object({
        model: z.string(),
        temperature: z.number().min(0).max(1).optional(),
        chunkSize: z.number().optional(),
        topK: z.number().optional()
    })
});

/**
 * POST /api/admin/rag/experiment
 * Runs a new RAG experiment from the playground
 */
async function postHandler(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const user = await enforcePermission('rag:experiment', 'create');
        const session = user as unknown as TenantSession;

        if (!session.user) {
            throw new AppError('AUTH_ERROR', 401, 'User session invalid');
        }

        const tenantId = session.user.tenantId;
        const userId = session.user.id;

        const body = await req.json();
        const validated = ExperimentRequestSchema.parse(body);

        const result = await RagExperimentService.runExperiment(
            tenantId,
            validated.query,
            {
                ...validated.config,
                promptKey: 'RAG_SANDBOX' // Default for playground
            },
            userId,
            session
        );

        return NextResponse.json({
            success: true,
            experiment: result
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_RAG_EXPERIMENT_POST', correlacion_id);
    }
}

/**
 * GET /api/admin/rag/experiment
 * Lists recent experiments
 */
async function getHandler(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const user = await enforcePermission('rag:experiment', 'read');
        const session = user as unknown as TenantSession;

        if (!session.user) {
            throw new AppError('AUTH_ERROR', 401, 'User session invalid');
        }

        const tenantId = session.user.tenantId;

        const experiments = await RagExperimentService.listExperiments(tenantId, session);

        return NextResponse.json({
            success: true,
            experiments
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_RAG_EXPERIMENT_GET', correlacion_id);
    }
}

export const POST = withPerformanceSLA(postHandler, {
    endpoint: 'POST_RAG_EXPERIMENT',
    thresholdMs: 5000, // SLA: 5s for experiments
    source: 'API_ADMIN'
});

export const GET = withPerformanceSLA(getHandler, {
    endpoint: 'GET_RAG_EXPERIMENTS',
    thresholdMs: 500,
    source: 'API_ADMIN'
});
