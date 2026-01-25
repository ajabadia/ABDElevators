import { getTenantCollection } from './db-tenant';
import { UsageLogSchema } from './schemas';
import { logEvento } from './logger';

/**
 * Servicio de Tracking de Consumo (Visión 2.0 - Fase 7.4)
 */
export class UsageService {
    /**
     * Registra el uso de tokens de LLM.
     */
    static async trackLLM(tenantId: string, tokens: number, model: string, correlacion_id?: string) {
        return this.logUsage({
            tenantId,
            tipo: 'LLM_TOKENS',
            valor: tokens,
            recurso: model,
            descripcion: `Consumo de ${tokens} tokens en modelo ${model}`,
            correlacion_id
        });
    }

    /**
     * Registra el uso de almacenamiento.
     */
    static async trackStorage(tenantId: string, bytes: number, resource: string, correlacion_id?: string) {
        return this.logUsage({
            tenantId,
            tipo: 'STORAGE_BYTES',
            valor: bytes,
            recurso: resource,
            descripcion: `Almacenamiento de ${Math.round(bytes / 1024)} KB en ${resource}`,
            correlacion_id
        });
    }

    /**
     * Registra una búsqueda vectorial.
     */
    static async trackVectorSearch(tenantId: string, correlacion_id?: string) {
        return this.logUsage({
            tenantId,
            tipo: 'VECTOR_SEARCH',
            valor: 1,
            recurso: 'mongodb-vector-search',
            descripcion: 'Consulta de búsqueda semántica realizada',
            correlacion_id
        });
    }

    /**
     * Método interno para persistir el log de uso.
     */
    private static async logUsage(data: any) {
        try {
            const validated = UsageLogSchema.parse(data);
            const { collection } = await getTenantCollection('usage_logs');

            await collection.insertOne(validated);

            // Detector de anomalías: Si el consumo es muy alto en una sola operación
            if (validated.tipo === 'LLM_TOKENS' && validated.valor > 10000) {
                // Import dinámico para evitar ciclos si NotificationService usa UsageService en el futuro
                const { NotificationService } = await import('@/lib/notification-service');

                await NotificationService.notify({
                    tenantId: validated.tenantId,
                    type: 'BILLING_EVENT',
                    level: 'WARNING',
                    title: 'Pico de Consumo Detectado',
                    message: `Se ha detectado una operación con un consumo inusual de ${validated.valor.toLocaleString()} tokens en el modelo ${validated.recurso}. Revisa si es un comportamiento esperado.`,
                    link: '/admin/billing',
                    metadata: {
                        resource: validated.recurso,
                        value: validated.valor
                    }
                });

                await logEvento({
                    nivel: 'WARN',
                    origen: 'USAGE_SERVICE',
                    accion: 'HIGH_CONSUMPTION',
                    mensaje: `Alto consumo de tokens detectado para tenant ${validated.tenantId}: ${validated.valor}`,
                    correlacion_id: validated.correlacion_id || 'SYSTEM'
                });
            }

            return true;
        } catch (error) {
            // No bloqueamos la ejecución principal si el tracking falla, pero lo logueamos
            console.error('[UsageService ERROR] Failed to log usage:', error);
            return false;
        }
    }
}
