import { BaseRepository } from './BaseRepository';
import { FederatedPattern } from '../schemas';
import { IntelligenceStats } from '../intelligence-analytics';
import { getTenantCollection } from '../db-tenant';

/**
 * 🧠 IntelligenceRepository
 * Centralized data access for patterns and stats.
 * Cluster: LOGS (for stats) / MAIN (for patterns)
 */
export class IntelligenceRepository extends BaseRepository<FederatedPattern> {
    protected collectionName = 'federated_patterns';

    // Custom method for stats as it lives in LOGS cluster
    async getGlobalStats() {
        const statsCollection = await getTenantCollection('intelligence_stats', null, 'LOGS');
        return statsCollection.findOne({}, { sort: { updatedAt: -1 } });
    }
}

export const intelligenceRepository = new IntelligenceRepository();
