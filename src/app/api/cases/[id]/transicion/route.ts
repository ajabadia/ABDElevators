import crypto from 'crypto';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CaseWorkflowEngine as WorkflowEngine } from '@abd/workflow-engine/server';
import { AppError, ValidationError, handleApiError } from '@/lib/errors';

/**
 * POST /api/casos/[id]/transicion
 * Ejecuta una transición de estado en el workflow de un caso.
 */
async function POST_internal (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');

        const { id } = await params;
        const body = await req.json();

        // En la Visión 2.0, el motor infiere el contexto del tenant y buscamos por toState
        const { toState, comment, signature } = body;

        if (!toState) {
            throw new ValidationError('Faltan el parámetro: toState');
        }

        const result = await WorkflowEngine.getInstance().executeTransition(
            id,
            toState,
            session.user.tenantId,
            session.user.id,
            [session.user.role],
            correlacion_id
        );

        return NextResponse.json({ ...result });

    } catch (error: any) {
        return handleApiError(error, 'API_CASOS_TRANSITION', correlacion_id);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/cases/[id]/transicion', thresholdMs: 1000 });
