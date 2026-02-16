import { NextRequest, NextResponse } from 'next/server';
import { logEvento } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth';

/**
 * API Route so client-side components can log events securely.
 */
export async function POST(req: NextRequest) {
    const correlacion_id = uuidv4();

    try {
        const body = await req.json();
        const session = await auth();

        // Enforce basic structure
        const { level, source, action, message, details, stack, correlationId } = body;

        // Fallback for legacy calls if necessary (though we refactored client)
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
            tenantId: session?.user?.tenantId,
            details: effectiveDetails,
            stack
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in logs API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
