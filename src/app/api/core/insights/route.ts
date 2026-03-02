import crypto from 'crypto';
import { NextRequest, NextResponse } from "next/server";
import { getTenantCollection } from "@/lib/db-tenant";
import { InsightEngine, Insight } from "@/core/engine/InsightEngine";
import { logEvento } from "@/lib/logger";
import { enforcePermission } from "@/lib/guardian-guard";
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError } from "@/lib/errors";

interface InsightCacheData {
    insights: Insight[];
    hasAnomalies: boolean;
    correlationId: string;
}

// Simple in-memory cache for insights (Phase 83 optimize)
const INSIGHT_CACHE = new Map<string, { data: InsightCacheData, timestamp: number }>();
const CACHE_TTL = 3600 * 1000; // 1 hour

/**
 * GET /api/core/insights
 * Obtiene recomendaciones inteligentes generadas por el Sistema basadas en el grafo.
 * SLA: P95 < 2000ms
 */
export const GET = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('knowledge', 'read');
        const tenantId = session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant';

        // Check Cache
        const cached = INSIGHT_CACHE.get(tenantId);
        const url = new URL(req.url);
        const forceRefresh = url.searchParams.get('refresh') === 'true';

        if (cached && (Date.now() - cached.timestamp < CACHE_TTL) && !forceRefresh) {
            return NextResponse.json({
                success: true,
                insights: cached.data.insights,
                hasAnomalies: cached.data.hasAnomalies,
                correlationId,
                fromCache: true
            });
        }

        const insights = await InsightEngine.getInstance().generateInsights(tenantId, correlationId);

        const hasAnomalies = insights.some(i => i.category === 'ANOMALY' || i.type === 'critical');

        // Obtener métrica de aprendizaje del Agente (Phase 7)
        const agent = await getTenantCollection('ai_corrections', session as any);
        const learnedCount = await agent.countDocuments({});

        await logEvento({
            level: 'INFO',
            source: 'CORE_INSIGHTS',
            action: 'GET_INSIGHTS',
            message: `Insights generados para tenant ${tenantId}. Aprendizajes: ${learnedCount}`,
            correlationId,
            details: { count: insights.length, learnedCount, hasAnomalies }
        });

        const responseData: InsightCacheData = {
            insights,
            hasAnomalies,
            correlationId
        };

        // Cache update
        INSIGHT_CACHE.set(tenantId, { data: responseData, timestamp: Date.now() });

        return NextResponse.json({
            success: true,
            ...responseData
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CORE_INSIGHTS_GET', correlationId);
    }
}, { endpoint: 'GET /api/core/insights', thresholdMs: 2000 });
