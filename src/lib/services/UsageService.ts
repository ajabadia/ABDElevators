import { usageSummaryRepository } from '../repositories/UsageSummaryRepository';
import { UsageSummary } from '../schemas/system';
import { Filter } from 'mongodb';

/**
 * 📈 UsageService
 * Proposito: Inteligencia sobre consumo y predicciones de costes.
 * Cluster: BILLING
 * 
 * Basado en la Regla de Oro #8: Measurable Performance.
 */
export class UsageService {
    /**
     * Predice el uso al final del periodo actual basándose en la media de los últimos 30 días.
     * Implementa un algoritmo de proyección lineal simple para el MVP de la Fase 11.
     */
    async predictMonthEndUsage(tenantId: string, metric: string): Promise<number> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        try {
            // Filtro para resúmenes diarios del último mes
            const query: Filter<UsageSummary> = {
                tenantId,
                period: 'DAILY',
                startDate: { $gte: thirtyDaysAgo } as any
            };

            const history = await usageSummaryRepository.list(query, { limit: 31 });

            if (!history || history.length === 0) {
                return 0;
            }

            // Calcular media diaria
            const totalUsage = history.reduce((sum, entry) => {
                return sum + (entry.metrics[metric] || 0);
            }, 0);

            const averageDaily = totalUsage / history.length;

            // Calcular días restantes en el mes actual
            const now = new Date();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const currentDay = now.getDate();
            const remainingDays = Math.max(0, daysInMonth - currentDay);

            // TODO: Obtener uso actual del mes (Month-to-Date) de una fuente real.
            // Por ahora, proyectamos sobre la base de la media calculada.
            const projectedRemaining = averageDaily * remainingDays;

            // Simulación de uso actual (esto debería ser una query real a MTD summaries)
            const currentMtdUsage = averageDaily * currentDay;

            return currentMtdUsage + projectedRemaining;
        } catch (error) {
            console.error(' [USAGE_SERVICE] Error predicting usage:', error);
            return 0;
        }
    }
}

export const usageService = new UsageService();
