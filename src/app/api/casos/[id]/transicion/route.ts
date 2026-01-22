import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowEngine } from '@/lib/workflow-engine';
import { AppError, ValidationError } from '@/lib/errors';
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

        // Extraemos industry y caseType (idealmente vendrían en el body o se inferirían del caso)
        // Por ahora exigimos que el cliente los envíe para simplificar el motor genérico
        const { action, industry, caseType, comment, signature } = body;

        if (!action || !industry || !caseType) {
            throw new ValidationError('Faltan parámetros: action, industry o caseType');
        }

        const result = await WorkflowEngine.executeTransition({
            caseId: id,
            action,
            role: session.user.role,
            industry,
            caseType,
            correlacion_id,
            comment,
            signature
        });

        return NextResponse.json({ ...result });

    } catch (error: any) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, error.message).toJSON(), { status: 500 });
    }
}
