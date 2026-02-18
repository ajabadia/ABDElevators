import { NextRequest, NextResponse } from 'next/server';
import { RagExperimentService } from '@/services/rag-experiment-service';
import { AppError, handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { z } from 'zod';
import crypto from 'crypto';

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
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const user = await enforcePermission('rag:experiment', 'create');
        const tenantId = (user as any).tenantId;
        const userId = (user as any).id;

        const body = await req.json();
        const validated = ExperimentRequestSchema.parse(body);

        const result = await RagExperimentService.runExperiment(
            tenantId,
            validated.query,
            {
                ...validated.config,
                promptKey: 'RAG_SANDBOX' // Default for playground
            },
            userId
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
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const user = await enforcePermission('rag:experiment', 'read');
        const tenantId = (user as any).tenantId;

        const experiments = await RagExperimentService.listExperiments(tenantId);

        return NextResponse.json({
            success: true,
            experiments
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_RAG_EXPERIMENT_GET', correlacion_id);
    }
}
