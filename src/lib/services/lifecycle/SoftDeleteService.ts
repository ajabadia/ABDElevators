
import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';

/**
 * 🗑️ Soft Delete Service
 * Proposito: Purga definitiva de registros marcados como borrados.
 */
export class SoftDeleteService {
    private static ELIGIBLE_COLLECTIONS = ['knowledge_assets', 'entities', 'workflow_tasks'];

    /**
     * Procesa registros "soft-deleted" antiguos.
     */
    static async purgeSoftDeleted(retentionDays: number = 30): Promise<{ cleaned: number }> {
        const correlationId = CorrelationIdService.generate();
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - retentionDays);

        let totalCleaned = 0;

        for (const collName of this.ELIGIBLE_COLLECTIONS) {
            const coll = await getTenantCollection(collName, null, 'MAIN');
            const filter = { deletedAt: { $lt: thresholdDate } };

            const result = await coll.deleteMany(filter, { hardDelete: true });
            totalCleaned += result.deletedCount || 0;
        }

        if (totalCleaned > 0) {
            await logEvento({
                level: 'INFO',
                source: 'SOFT_DELETE_SERVICE',
                action: 'PURGE_FINAL',
                message: `Purga definitiva de ${totalCleaned} registros soft-deleted`,
                correlationId
            });
        }

        return { cleaned: totalCleaned };
    }
}
