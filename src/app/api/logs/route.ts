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
        const { nivel, origen, accion, mensaje, detalles, stack } = body;

        if (!nivel || !origen || !accion || !mensaje) {
            return NextResponse.json({ error: 'Missing log fields' }, { status: 400 });
        }

        await logEvento({
            nivel,
            origen: `${origen}_CLIENT`,
            accion,
            mensaje,
            correlacion_id: body.correlacion_id || correlacion_id,
            tenantId: session?.user?.tenantId,
            detalles,
            stack
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in logs API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
