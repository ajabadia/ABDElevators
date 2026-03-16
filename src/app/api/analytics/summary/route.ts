import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/core/services/AnalyticsService';
import { UsageService } from '@/services/ops/usage-service';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function GET_internal() {
    return withCorrelation(
        { level: 'INFO', source: 'API_ANALYTICS_SUMMARY', action: 'GET_REPORT' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('usage:stats', 'read');
                const tenantId = session.user.tenantId;

                await log({
                    message: 'Fetching multi-source analytics summary',
                    tenantId
                });

                // Parallelize fetching
                const [tokenUsage, ragPerf, health, roi] = await Promise.all([
                    AnalyticsService.getDailyTokenUsage(tenantId),
                    AnalyticsService.getRAGPerformance(tenantId),
                    AnalyticsService.getSystemHealth(tenantId),
                    UsageService.getTenantROI(tenantId)
                ]);

                await log({
                    message: 'Analytics summary retrieved successfully',
                    details: { 
                        hasROI: !!roi,
                        tokenUsageCount: tokenUsage.length 
                    },
                    tenantId
                });

                return NextResponse.json({
                    success: true,
                    data: {
                        tokens: tokenUsage,
                        rag: ragPerf,
                        health: health,
                        roi: roi
                    }
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ANALYTICS_SUMMARY_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/analytics/summary', thresholdMs: 1000 });
