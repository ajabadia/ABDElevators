import { NextRequest, NextResponse } from "next/server";
import { getIntelligenceDashboard } from "@/core/engine/index.server";
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError } from "@/lib/errors";
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/core/dashboard/intelligence
 * Obtiene métricas agregadas de inteligencia colectiva (Fase 9).
 * SLA: P95 < 2000ms
 */
async function GET_internal() {
    return withCorrelation(
        { level: 'INFO', source: 'API_CORE_DASHBOARD_INTEL', action: 'GET_METRICS' },
        async ({ correlationId, log }) => {
            try {
                const session = await requirePermission('knowledge', 'read');
                const tenantId = session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant';

                await log({
                    message: 'Calculating collective intelligence metrics',
                    tenantId
                });

                const metrics = await getIntelligenceDashboard().getMetrics(tenantId);

                await log({
                    message: 'Intelligence metrics retrieved',
                    details: { 
                        agentPerformance: !!metrics.agentPerformance,
                        activeLearners: metrics.activeLearners 
                    },
                    tenantId
                });

                return NextResponse.json({
                    success: true,
                    metrics,
                    correlationId
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CORE_DASHBOARD_INTEL_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/core/dashboard/intelligence', thresholdMs: 2000 });
