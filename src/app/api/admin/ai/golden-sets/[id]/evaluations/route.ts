import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { auth } from '@/auth';
import { AppError, ValidationError } from '@/lib/errors';
import { EntityIdSchema, TenantIdSchema } from '@/lib/schemas/common';
import { ragEvaluationRepository } from '@/lib/repositories/RagEvaluationRepository';
import { logEvento } from '@/lib/logger';

/**
 * GET /api/admin/ai/golden-sets/[id]/evaluations
 * Returns quality evaluations for a specific golden set query.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const correlationId = crypto.randomUUID();
    const { id } = await params;

    if (!session?.user?.tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    try {
        const validatedId = EntityIdSchema.parse(id);
        const tId = TenantIdSchema.parse(tenantId);
        const tSession = { user: session.user } as any;

        // Query the rag_evaluations collection via repository
        const evaluations = await ragEvaluationRepository.list(
            { goldenSetId: validatedId },
            { sort: { timestamp: -1 }, limit: 100 },
            tSession
        );

        await logEvento({
            level: 'INFO',
            source: 'API_GOLDEN_SETS',
            action: 'FETCH_EVALUATIONS',
            message: `Fetched ${evaluations.length} evaluations for ${id}`,
            tenantId,
            correlationId
        });

        return NextResponse.json({
            success: true,
            data: evaluations
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_GOLDEN_SETS',
            action: 'FETCH_EVALUATIONS_ERROR',
            message: (error as Error).message,
            tenantId,
            correlationId,
            stack: (error as Error).stack
        });

        return NextResponse.json({
            error: 'Internal Server Error',
            details: (error as Error).message
        }, { status: 500 });
    }
}
