import { BaseRepository } from './BaseRepository';
import { UsageLog } from '@/lib/schemas/billing';

/**
 * 📊 UsageLogRepository
 * Proposito: Gestión de logs de uso granular.
 * Cluster: LOGS (Observability)
 */
export class UsageLogRepository extends BaseRepository<UsageLog> {
    constructor() {
        super('usage_logs', 'LOGS');
    }

    /**
     * Accede a la colección cruda para agregaciones complejas que saltan el proxy multi-tenant.
     */
    async getRawCollection() {
        const collection = await this.getCollection(null);
        // This is an internal breakout for observability.
        return (collection as unknown as { unsecureRawCollection: any }).unsecureRawCollection;
    }
}

export const usageLogRepository = new UsageLogRepository();
