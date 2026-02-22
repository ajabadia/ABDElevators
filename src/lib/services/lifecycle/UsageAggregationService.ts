
import { getTenantCollection } from '@/lib/db-tenant';
import { CorrelationIdService } from '@/services/common/CorrelationIdService';
import { LogLifecycleService } from './LogLifecycleService';

/**
 * 📊 Usage Aggregation Service
 * Proposito: Consolidar logs de uso detallados en resúmenes históricos.
 */
export class UsageAggregationService {
    /**
     * Agrega métricas detalladas en resúmenes.
     */
    static async aggregateMetrics(days: number = 30): Promise<{ aggregated: number }> {
        const correlationId = CorrelationIdService.generate();
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - days);

        const logsColl = await getTenantCollection('usage_logs', null, 'LOGS');

        // 1. Agregación
        const aggregation = await logsColl.aggregate([
            { $match: { timestamp: { $lt: thresholdDate } } },
            {
                $group: {
                    _id: { tenantId: '$tenantId', type: '$type' },
                    totalValue: { $sum: '$value' },
                    minDate: { $min: '$timestamp' },
                    maxDate: { $max: '$timestamp' }
                }
            }
        ]);

        const summariesColl = await getTenantCollection('usage_summaries', null, 'LOGS');
        let count = 0;

        for (const entry of aggregation as any[]) {
            await summariesColl.insertOne({
                tenantId: entry._id.tenantId,
                period: 'MONTHLY',
                startDate: entry.minDate,
                endDate: entry.maxDate,
                metrics: { [entry._id.type]: entry.totalValue },
                createdAt: new Date()
            } as any);
            count++;
        }

        if (count > 0) {
            // 2. Archivar y Purgar logs ya agregados
            await LogLifecycleService.archiveLogs('usage_logs', { timestamp: { $lt: thresholdDate } });
            await logsColl.deleteMany({ timestamp: { $lt: thresholdDate } }, { hardDelete: true });
        }

        return { aggregated: count };
    }
}
