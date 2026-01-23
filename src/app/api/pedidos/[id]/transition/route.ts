import { NextResponse } from 'next/server';
import { WorkflowEngine } from '@/lib/workflow-engine';
import { auth } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * API para ejecutar transiciones de estado en pedidos/casos.
 * Fase 7.2: Motor de Workflows Multinivel.
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = uuidv4();
    const { id } = await params;

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const body = await request.json();
        const { toState, comment, signature } = body;

        if (!toState) {
            throw new AppError('VALIDATION_ERROR', 400, 'El estado destino (toState) es requerido');
        }

        // Ejecutar la transición a través del motor
        const result = await WorkflowEngine.executeTransition({
            caseId: id,
            toState,
            role: session.user.role,
            correlacion_id,
            comment,
            signature
        });

        return NextResponse.json(result);

    } catch (error) {
        return handleApiError(error, 'API_WORKFLOW_TRANSITION', correlacion_id);
    }
}
