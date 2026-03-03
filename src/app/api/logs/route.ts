import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { logEvento } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { enforcePermission } from '@/lib/guardian-guard';
import { AppError } from '@/lib/errors';

/**
 * API Route so client-side components can log events securely.
 */
async function POST_internal(req: NextRequest) {
    const correlacion_id = uuidv4();

    try {
        const session = await enforcePermission('platform:metrics', 'write');
        const body = await req.json();

        // Enforce basic structure
        const { level, source, action, message, details, stack, correlationId } = body;

        const effectiveLevel = level || body.nivel;
        const effectiveSource = source || body.origen;
        const effectiveAction = action || body.accion;
        const effectiveMessage = message || body.mensaje;
        const effectiveDetails = details || body.detalles;
        const effectiveCorrelationId = correlationId || body.correlacion_id || correlacion_id;

        if (!effectiveLevel || !effectiveSource || !effectiveAction || !effectiveMessage) {
            return NextResponse.json({ error: 'Missing log fields' }, { status: 400 });
        }

        await logEvento({
            level: effectiveLevel,
            source: `${effectiveSource}_CLIENT`,
            action: effectiveAction,
            message: effectiveMessage,
            correlationId: effectiveCorrelationId,
            tenantId: session.user.tenantId,
            details: effectiveDetails,
            stack
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        console.error('Error in logs API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/logs', thresholdMs: 1000 });
