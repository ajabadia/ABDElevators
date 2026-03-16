import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextResponse } from 'next/server';
import { UsageService } from '@/services/ops/usage-service';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * Endpoint para obtener métricas personales del usuario.
 * Fase 24.2: User View (Personal Insights)
 */
export const GET = withPerformanceSLA(async () =>
    withCorrelation(
        { level: 'INFO', source: 'APIUSERSTATS', action: 'GETSTATS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('user:profile', 'read');

                const stats = await UsageService.getUserMetrics(session.user.id, session.user.tenantId);

                await log({
                    message: 'User metrics retrieved',
                    details: {
                        userId: session.user.id,
                        tenantId: session.user.tenantId
                    }
                });

                return NextResponse.json({
                    success: true,
                    stats
                });

            } catch (error) {
                return handleApiError(error, 'APIUSERSTATS', correlationId);
            }
        }
    ),
    { endpoint: 'GET /api/user/stats', thresholdMs: 500 }
);
