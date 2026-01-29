import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PredictiveEngine } from "@/core/engine/PredictiveEngine";
import { logEvento } from "@/lib/logger";
import crypto from 'crypto';

/**
 * GET /api/core/predictive/maintenance
 * Obtiene el tablero de mantenimiento predictivo (Fase KIMI 8).
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenantId = session.user.tenantId || 'default_tenant';
    const correlacion_id = crypto.randomUUID();

    try {
        const predictions = await PredictiveEngine.getInstance().getMaintenanceForecast(tenantId, correlacion_id);

        return NextResponse.json({
            success: true,
            predictions,
            correlacion_id
        });
    } catch (error: any) {
        console.error('[CORE_PREDICTIVE] Error:', error);
        return NextResponse.json({
            success: false,
            message: "Error al generar predicciones",
            error: error.message
        }, { status: 500 });
    }
}
