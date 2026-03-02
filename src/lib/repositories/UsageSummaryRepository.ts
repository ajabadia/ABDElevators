import { BaseRepository } from './BaseRepository';
import { UsageSummary } from '@/lib/schemas/system';

/**
 * 📊 UsageSummaryRepository
 * Proposito: Gestión de resúmenes de uso históricos.
 * Cluster: LOGS (Observability)
 */
export class UsageSummaryRepository extends BaseRepository<UsageSummary> {
    protected readonly collectionName = 'usage_summaries';
    protected readonly clusterName = 'LOGS';
}

export const usageSummaryRepository = new UsageSummaryRepository();
