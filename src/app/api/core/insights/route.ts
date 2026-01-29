import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantCollection } from "@/lib/db-tenant";
import { InsightEngine } from "@/core/engine/InsightEngine";
import { logEvento } from "@/lib/logger";
import crypto from 'crypto';

/**
 * GET /api/core/insights
 * Obtiene recomendaciones inteligentes generadas por KIMI basadas en el grafo.
 * SLA: P95 < 2000ms
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenantId = session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant';
    const correlacion_id = crypto.randomUUID();

    try {
        const insights = await InsightEngine.getInstance().generateInsights(tenantId, correlacion_id);

        // Obtener métrica de aprendizaje del Agente (KIMI Phase 7)
        const agent = await getTenantCollection('ai_corrections', { user: { tenantId } });
        const learnedCount = await agent.countDocuments({});

        await logEvento({
            nivel: 'INFO',
            origen: 'CORE_INSIGHTS',
            accion: 'GET_INSIGHTS',
            mensaje: `Insights generados para tenant ${tenantId}. Aprendizajes: ${learnedCount}`,
            correlacion_id,
            detalles: { count: insights.length, learnedCount }
        });

        return NextResponse.json({
            success: true,
            insights,
            correlacion_id
        });
    } catch (error: any) {
        console.error('[CORE_INSIGHTS] Error:', error);
        return NextResponse.json({
            success: false,
            message: "Error al generar insights inteligentes",
            error: error.message
        }, { status: 500 });
    }
}
