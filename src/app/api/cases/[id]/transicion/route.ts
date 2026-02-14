import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { LegacyCaseWorkflowEngine as WorkflowEngine } from '@/lib/workflow-engine';
import { AppError, ValidationError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * POST /api/casos/[id]/transicion
 * Ejecuta una transición de estado en el workflow de un caso.
 */
export async function POST(
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

        const result = await WorkflowEngine.executeTransition({
            caseId: id,
            toState,
            role: session.user.role, correlationId: correlacion_id,
            comment,
            signature
        });

        return NextResponse.json({ ...result });

    } catch (error: any) {
        return handleApiError(error, 'API_CASOS_TRANSITION', correlacion_id);
    }
}
