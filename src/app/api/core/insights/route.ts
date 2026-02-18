import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantCollection } from "@/lib/db-tenant";
import { InsightEngine } from "@/core/engine/InsightEngine";
import { logEvento } from "@/lib/logger";
import { AppError, handleApiError } from "@/lib/errors";
import crypto from 'crypto';

// Simple in-memory cache for insights (Phase 83 optimize)
const INSIGHT_CACHE = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 3600 * 1000; // 1 hour

/**
 * GET /api/core/insights
 * Obtiene recomendaciones inteligentes generadas por el Sistema basadas en el grafo.
 * SLA: P95 < 2000ms
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
    }

    const tenantId = session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant';
    const correlacion_id = crypto.randomUUID();

    // Check Cache
    const cached = INSIGHT_CACHE.get(tenantId);
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    if (cached && (Date.now() - cached.timestamp < CACHE_TTL) && !forceRefresh) {
        return NextResponse.json({
            success: true,
            insights: cached.data.insights,
            hasAnomalies: cached.data.hasAnomalies,
            correlationId: correlacion_id,
            fromCache: true
        });
    }

    try {
        const insights = await InsightEngine.getInstance().generateInsights(tenantId, correlacion_id);

        const hasAnomalies = insights.some(i => i.category === 'ANOMALY' || i.type === 'critical');

        // Obtener métrica de aprendizaje del Agente (Phase 7)
        const agent = await getTenantCollection('ai_corrections', session as any);
        const learnedCount = await agent.countDocuments({});

        await logEvento({
            level: 'INFO',
            source: 'CORE_INSIGHTS',
            action: 'GET_INSIGHTS',
            message: `Insights generados para tenant ${tenantId}. Aprendizajes: ${learnedCount}`, correlationId: correlacion_id,
            details: { count: insights.length, learnedCount, hasAnomalies }
        });

        const responseData = {
            success: true,
            insights,
            hasAnomalies,
            correlationId: correlacion_id
        };

        // Cache update
        INSIGHT_CACHE.set(tenantId, { data: responseData, timestamp: Date.now() });

        return NextResponse.json(responseData);
    } catch (error: any) {
        return handleApiError(error, 'CORE_INSIGHTS', correlacion_id);
    }
}
