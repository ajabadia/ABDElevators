import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { QualityInsightsService } from '@/services/admin/quality-insights-service';
import { AppError, handleApiError, ValidationError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import { TenantIdSchema } from '@/lib/schemas';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * 🚀 GET /api/admin/quality/insights
 * Phase 308: Quality Insights API for the suite.
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_QUALITY_INSIGHTS', action: 'GET_STATS' },
        async ({ log, correlationId }) => {
            try {
                const session = await auth();
                if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
                    throw new AppError('UNAUTHORIZED', 403, 'Only admins can access quality insights');
                }

                const tenantId = TenantIdSchema.parse((session.user as any).tenantId);
                if (!tenantId) throw new ValidationError('Tenant ID missing in session');

                // Parallelize data fetching
                const [globalStats, manualInsights] = await Promise.all([
                    QualityInsightsService.getGlobalQuality({ tenantId }),
                    QualityInsightsService.getManualInsights(tenantId)
                ]);

                await log({
                    message: 'Fetched quality insights',
                    details: { tenantId }
                });

                return NextResponse.json({
                    success: true,
                    data: {
                        stats: globalStats,
                        manuals: manualInsights
                    }
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_QUALITY_INSIGHTS', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/quality/insights', thresholdMs: 1000 });
