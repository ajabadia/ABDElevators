import { NextRequest, NextResponse } from "next/server";
import { getTenantCollection } from "@/lib/db-tenant";
import { getInsightEngine, Insight } from "@/core/engine/index.server";
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError } from "@/lib/errors";
import { withCorrelation } from '@/lib/logger/with-correlation';
import { TenantIdSchema } from "@/lib/schemas";
import { z } from "zod";

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
    return withCorrelation(
        { level: 'INFO', source: 'CORE_INSIGHTS', action: 'GET_INSIGHTS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge', 'read');
                const tenantId = TenantIdSchema.parse(session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant');

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

                const insights = await getInsightEngine().generateInsights(tenantId, correlationId);

                const hasAnomalies = insights.some((i: Insight) => i.category === 'ANOMALY' || i.type === 'critical');

                // Obtener métrica de aprendizaje del Agente (Phase 7)
                const agent = await getTenantCollection('ai_corrections', session, 'MAIN');
                const learnedCount = await agent.countDocuments({});

                await log({
                    message: `Insights generados para tenant ${tenantId}. Aprendizajes: ${learnedCount}`,
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
        }
    );
}, { endpoint: 'GET /api/core/insights', thresholdMs: 2000 });
