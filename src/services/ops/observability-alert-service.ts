import { connectDB, connectAuthDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { NotificationService } from '@/services/core/notification-service';

export class ObservabilityAlertService {
    /**
     * Monitorea violaciones de SLA en tiempo real.
     */
    static async trackSLAViolation(tenantId: string, endpoint: string, duration: number, threshold: number, correlationId: string) {
        if (duration > threshold) {
            await logEvento({
                level: 'WARN',
                source: 'SLA_MONITOR',
                action: 'SLA_VIOLATION',
                message: `Exceso de latencia en ${endpoint}: ${duration}ms (límite ${threshold}ms)`,
                correlationId,
                details: { duration, threshold, endpoint }
            });

            if (duration > threshold * 2) {
                await NotificationService.notify({
                    tenantId: 'SYSTEM',
                    type: 'SYSTEM',
                    level: 'ERROR',
                    title: 'Degradación de Performance Detectada',
                    message: `El endpoint ${endpoint} está respondiendo en ${duration}ms, superando críticamente el SLA de ${threshold}ms.`,
                    link: '/admin/analytics'
                });
            }
        }
    }

    /**
     * Detecta anomalías de inactividad (posible churn).
     */
    static async checkForActivityAnomalies() {
        const db = await connectDB();
        const authDb = await connectAuthDB();
        const fortyEightHoursAgo = new Date();
        fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

        const activeTenants = await authDb.collection('tenants').find({ status: 'active' }).toArray();

        for (const tenant of activeTenants) {
            const lastActivity = await db.collection('usage_logs')
                .find({ tenantId: tenant._id.toString() })
                .sort({ timestamp: -1 })
                .limit(1)
                .next();

            if (lastActivity && lastActivity.timestamp < fortyEightHoursAgo) {
                await logEvento({
                    level: 'INFO',
                    source: 'ANOMALY_DETECTOR',
                    action: 'INACTIVITY_DETECTED',
                    message: `Tenant ${tenant.name} lleva >48h sin actividad operativa.`,
                    correlationId: 'SYSTEM'
                });
            }
        }
    }
}
