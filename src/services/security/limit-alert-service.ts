import { connectAuthDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { sendLimitAlert } from '@/lib/email-service';

/**
 * 🚨 LimitAlertService: Gestiona las alertas de consumo y cuotas (Phase 120.2)
 * Se encarga de notificar a los administradores cuando se alcanzan umbrales críticos.
 */
export class LimitAlertService {

    /**
     * Envía una notificación de límite si se superan los umbrales (80%, 100%).
     */
    static async sendLimitNotificationIfNeeded(params: {
        tenantId: string,
        resourceType: 'tokens' | 'storage' | 'searches' | 'api_requests',
        currentUsage: number,
        limit: number,
        percentage: number,
        tier: string
    }): Promise<void> {
        const { tenantId, resourceType, currentUsage, limit, percentage, tier } = params;

        // Solo notificar en umbrales críticos (80% o 100%)
        if (percentage < 80) return;

        const correlationId = `limit-alert-${tenantId}-${Date.now()}`;

        try {
            const authDb = await connectAuthDB();

            // 1. Verificar si ya se envió notificación en las últimas 24h para este umbral
            const threshold = percentage >= 100 ? 100 : 80;
            const lastNotification = await authDb.collection('email_notifications').findOne({
                tenantId,
                resourceType,
                percentage: threshold,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });

            if (lastNotification) return;

            // 2. Obtener datos del admin y del tenant
            const [admin, tenant] = await Promise.all([
                authDb.collection('users').findOne({ tenantId, role: 'ADMIN' }),
                authDb.collection('tenants').findOne({ tenantId })
            ]);

            if (!admin?.email) {
                await logEvento({
                    level: 'WARN',
                    source: 'LIMIT_ALERT',
                    action: 'ADMIN_NOT_FOUND',
                    message: `No se encontró admin con email para el tenant ${tenantId}`,
                    correlationId
                });
                return;
            }

            // 3. Enviar alerta via Email Service
            await sendLimitAlert({
                to: admin.email,
                tenantName: tenant?.name || 'Tu Organización',
                resourceType,
                currentUsage,
                limit,
                percentage,
                tier
            });

            // 4. Registrar persistencia de la notificación
            await authDb.collection('email_notifications').insertOne({
                tenantId,
                resourceType,
                percentage: threshold,
                sentTo: admin.email,
                createdAt: new Date()
            });

            await logEvento({
                level: 'INFO',
                source: 'LIMIT_ALERT',
                action: 'ALERT_SENT',
                message: `Alerta de ${resourceType} (${percentage.toFixed(1)}%) enviada a ${admin.email}`,
                correlationId,
                details: { tenantId, resourceType, percentage }
            });

        } catch (error) {
            await logEvento({
                level: 'ERROR',
                source: 'LIMIT_ALERT',
                action: 'ALERT_FAILED',
                message: `Error procesando alerta de límite: ${(error as Error).message}`,
                correlationId,
                stack: (error as Error).stack
            });
        }
    }
}
