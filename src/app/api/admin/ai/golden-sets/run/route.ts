import { NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError, AppError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { RagExperimentRunner } from '@/services/admin/rag-experiment-runner';
import { logEvento } from '@/lib/logger';
import { z } from 'zod';

const RunExperimentSchema = z.object({
    name: z.string().min(1).optional().default('Golden Set Baseline Evaluation'),
    variants: z.array(z.object({
        id: z.string(),
        engineVersion: z.enum(['v1', 'v2']),
        config: z.record(z.string(), z.any()).optional().default({})
    })).min(1).optional().default([
        { id: 'v1-baseline', engineVersion: 'v1' as const, config: {} },
        { id: 'v2-hierarchical', engineVersion: 'v2' as const, config: {} }
    ])
});

export async function POST(req: Request) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await requirePermission('admin:ai', 'write');
        const tenantId = session.user.tenantId;

        const body = await req.json().catch(() => ({}));
        const validated = RunExperimentSchema.parse(body);

        const { ragExperimentRepository } = await import('@/lib/repositories/RagExperimentRepository');

        const experimentId = await ragExperimentRepository.create({
            name: validated.name as string,
            status: 'PENDING',
            variants: validated.variants,
            tenantId,
            createdAt: new Date(),
        } as any, session as any);

        // Start experiment in background (fire and forget)
        // In a serverless env, this might require a background worker like BullMQ,
        // but for now we follow the existing RagExperimentRunner pattern.
        RagExperimentRunner.runExperiment(experimentId, tenantId, correlationId)
            .catch(err => {
                console.error(`[API_GOLDEN_SETS_RUN] Background experiment error:`, err);
            });

        const duration = Date.now() - start;
        await logEvento({
            level: 'INFO',
            source: 'API_GOLDEN_SETS',
            action: 'RUN_EXPERIMENT',
            message: `Started experiment ${experimentId}`,
            correlationId,
            tenantId,
            userId: session.user.id,
            details: { experimentId, variants: validated.variants, duration_ms: duration }
        });

        return NextResponse.json({ success: true, experimentId, correlationId });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, code: 'VALIDATION_ERROR', details: error.format() }, { status: 400 });
        }
        return handleApiError(error, 'API_GOLDEN_SETS_RUN', correlationId);
    }
}
