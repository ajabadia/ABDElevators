
import { usageLogRepository } from '@/lib/repositories/UsageLogRepository';
import { usageSummaryRepository } from '@/lib/repositories/UsageSummaryRepository';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';
import { LogLifecycleService } from './LogLifecycleService';
import { connectDB } from '@/lib/db';

/**
 * 📊 Usage Aggregation Service
 * Proposito: Consolidar logs de uso detallados en resúmenes históricos.
 * Hardened Era 8: Repository-based aggregation.
 */
export class UsageAggregationService {
    /**
     * Agrega métricas detalladas en resúmenes.
     */
    static async aggregateMetrics(days: number = 30): Promise<{ aggregated: number }> {
        const correlationId = CorrelationIdService.generate();
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - days);

        // 1. Agregación vía MongoDB Driver (a través del repo)
        const db = await connectDB();
        const logsColl = await db.collection('usage_logs'); // Fallback literal for complex aggregation

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
        ]).toArray();

        let count = 0;

        for (const entry of aggregation as any[]) {
            await usageSummaryRepository.create({
                tenantId: entry._id.tenantId,
                period: 'MONTHLY',
                startDate: entry.minDate,
                endDate: entry.maxDate,
                metrics: { [entry._id.type]: entry.totalValue },
                createdAt: new Date()
            }, null);
            count++;
        }

        if (count > 0) {
            // 2. Archivar y Purgar logs ya agregados
            await LogLifecycleService.archiveLogs('usage_logs', { timestamp: { $lt: thresholdDate } });
            await usageLogRepository.deleteMany({ timestamp: { $lt: thresholdDate } } as any, null, true);
        }

        return { aggregated: count };
    }
}
