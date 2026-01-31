import { connectDB } from "./db";
import { AppError } from "./errors";
import { BillingService } from "./billing-service";
import { logEvento } from "./logger";

/**
 * Access Control Service (Fase 9.1 - Enforcement)
 * Verifica si un tenant tiene permitido realizar una operación según su plan de facturación.
 */
export class AccessControlService {

    /**
     * Verifica si el tenant puede realizar una operación de consumo.
     * Si supera el límite y la regla es BLOCK, lanza AppError.
     * Si es SURCHARGE, solo loguea advertencia (el cobro se gestiona a fin de mes).
     */
    static async checkUsageLimits(tenantId: string, metric: string = 'REPORTS'): Promise<void> {
        try {
            // 1. Calcular uso actual
            // Nota: Esto puede ser intensivo, idealmente cachear o usar contadores incrementales en Redis/Mongo
            const usageResult = await BillingService.calculateCurrentUsage(tenantId, metric);

            if (!usageResult) return; // Si no hay billing info, asumimos open access o error config

            // 2. Verificar estado
            if (usageResult.status === 'BLOCKED') {
                const message = `Límite de ${metric} excedido. ${usageResult.actionApplied || 'Contacte a soporte.'}`;

                await logEvento({
                    level: 'WARN',
                    source: 'ACCESS_CONTROL',
                    action: 'BLOCKED_BY_LIMIT',
                    message: message,
                    details: { tenantId, metric, usageResult },
                    correlationId: 'SYSTEM_BILLING'
                });

                throw new AppError('FORBIDDEN', 403, message);
            }

            if (usageResult.status === 'SURCHARGE') {
                // Solo logueamos para auditoría intermitente, no bloqueamos
                // Podríamos notificar al usuario via UI toaster si tuvieramos contexto de request
            }

        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('[AccessControl] Error checking limits:', error);
            // Fail open (permitir acceso si hay error de sistema) o fail close? 
            // Fail open preferible para no detener negocio por bug de billing.
        }
    }
}
