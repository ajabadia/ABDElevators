import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';
import { ProactiveAlertService } from '@/services/observability/ProactiveAlertService';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

/**
 * 🛰️ API Proactive Health Check
 * Era 15: Returns current system alerts based on P95 and security anomalies.
 */
async function GET_internal() {
    return withCorrelation(
        { level: 'INFO', source: 'API_PROACTIVE_HEALTH', action: 'CHECK_SYSTEM' },
        async ({ log, correlationId }) => {
            try {
                await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
                
                const alerts = await ProactiveAlertService.checkSystemHealth();
                
                // 📧 Phase 440.2: Trigger email for critical anomalies
                if (alerts.some(a => a.severity === 'CRITICAL')) {
                    await ProactiveAlertService.notifyCriticalAlerts(alerts);
                    await log({
                        level: 'WARN',
                        message: 'Critical alerts detected and notified',
                        details: { criticalCount: alerts.filter(a => a.severity === 'CRITICAL').length }
                    });
                }

                await log({
                    message: `System health check completed with ${alerts.length} alerts`,
                    details: { alertCount: alerts.length }
                });

                return NextResponse.json({ 
                    success: true, 
                    timestamp: new Date().toISOString(),
                    alerts 
                });
            } catch (error) {
                return handleApiError(error, 'API_PROACTIVE_HEALTH', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/proactive-health', thresholdMs: 1000 });
