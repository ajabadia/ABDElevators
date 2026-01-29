import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { IntelligenceDashboard } from "@/core/engine/IntelligenceDashboard";
import { logEvento } from "@/lib/logger";

/**
 * GET /api/core/dashboard/intelligence
 * Obtiene métricas agregadas de inteligencia colectiva (Fase KIMI 9).
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenantId = session.user.tenantId || 'default_tenant';

    try {
        const metrics = await IntelligenceDashboard.getInstance().getMetrics(tenantId);

        return NextResponse.json({
            success: true,
            metrics
        });
    } catch (error: any) {
        console.error('[CORE_DASHBOARD_INTEL] Error:', error);
        return NextResponse.json({
            success: false,
            message: "Error al obtener métricas de inteligencia",
            error: error.message
        }, { status: 500 });
    }
}
