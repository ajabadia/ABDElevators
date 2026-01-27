import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { NotificationService } from './notification-service';

/**
 * Servicio de Observabilidad Avanzada (Fase 24)
 * Enfocado en detección de anomalías y monitoreo de salud proactivo.
 */
export class ObservabilityService {

    /**
     * Monitorea violaciones de SLA en tiempo real.
     * Se llama desde middlewares o interceptores de performance.
     */
    static async trackSLAViolation(tenantId: string, endpoint: string, duration: number, threshold: number, correlacion_id: string) {
        if (duration > threshold) {
            await logEvento({
                nivel: 'WARN',
                origen: 'SLA_MONITOR',
                accion: 'SLA_VIOLATION',
                mensaje: `Exceso de latencia en ${endpoint}: ${duration}ms (límite ${threshold}ms)`,
                correlacion_id,
                detalles: { duration, threshold, endpoint }
            });

            // Si es una violación crítica (> 2x threshold), notificar a SuperAdmin
            if (duration > threshold * 2) {
                await NotificationService.notify({
                    tenantId: 'SYSTEM', // Notificación global para SuperAdmins
                    type: 'SYSTEM',
                    level: 'ERROR',
                    title: 'Degradación de Performance Detectada',
                    message: `El endpoint ${endpoint} está respondiendo en ${duration}ms, superando críticamente el SLA de ${threshold}ms. Posible saturación de infraestructura o modelo LLM.`,
                    link: '/admin/analytics'
                });
            }
        }
    }

    /**
     * Detecta "Silencio Inusual" (Posible churn o error de integración).
     * Se debe ejecutar vía cron o tarea programada.
     */
    static async checkForActivityAnomalies() {
        const db = await connectDB();
        const fortyEightHoursAgo = new Date();
        fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

        // Buscar tenants que tenían actividad pero llevan > 48h en silencio
        const activeTenants = await db.collection('tenants').find({ status: 'active' }).toArray();

        for (const tenant of activeTenants) {
            const lastActivity = await db.collection('usage_logs')
                .find({ tenantId: tenant._id.toString() })
                .sort({ timestamp: -1 })
                .limit(1)
                .next();

            if (lastActivity && lastActivity.timestamp < fortyEightHoursAgo) {
                // Solo notificar si antes tenían actividad recurrente
                await logEvento({
                    nivel: 'INFO',
                    origen: 'ANOMALY_DETECTOR',
                    accion: 'INACTIVITY_DETECTED',
                    mensaje: `Tenant ${tenant.name} lleva >48h sin actividad operativa.`,
                    correlacion_id: 'SYSTEM'
                });

                // Aquí se podría disparar una alerta comercial
                console.log(`[ANOMALY] Tenant ${tenant.name} is possibly churning.`);
            }
        }
    }

    /**
     * Reporte de Salud del Sistema (Snapshot)
     */
    static async getSystemHealth() {
        const db = await connectDB();
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const recentErrors = await db.collection('logs_aplicacion').countDocuments({
            nivel: 'ERROR',
            timestamp: { $gte: oneHourAgo }
        });

        const recentSLA = await db.collection('logs_aplicacion').countDocuments({
            accion: 'SLA_VIOLATION',
            timestamp: { $gte: oneHourAgo }
        });

        return {
            status: recentErrors > 50 ? 'CRITICAL' : recentErrors > 10 ? 'WARNING' : 'HEALTHY',
            metrics: {
                errors_last_hour: recentErrors,
                sla_violations_last_hour: recentSLA
            }
        };
    }
}
