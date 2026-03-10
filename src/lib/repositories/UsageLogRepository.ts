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
}

export const usageLogRepository = new UsageLogRepository();
