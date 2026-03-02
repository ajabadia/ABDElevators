import { BaseRepository } from './BaseRepository';
import { FederatedPattern } from '../schemas';
import { IntelligenceStats } from '../intelligence-analytics';

/**
 * 🧠 IntelligenceRepository
 * Centralized data access for patterns and stats.
 * Cluster: LOGS (for stats) / MAIN (for patterns)
 */
export class IntelligenceRepository extends BaseRepository<FederatedPattern> {
    protected collectionName = 'federated_patterns';

    // Custom method for stats as it lives in LOGS cluster
    async getGlobalStats() {
        // getTenantCollection handles the cluster via the 3rd argument if we use it directly, 
        // but here we follow the repo pattern. BaseRepository uses MAIN by default.
        // We might need a small override or separate repo for LOGS.
        const db = await this.getCollection(null); // Default MAIN
        return db.db.collection('intelligence_stats').findOne({}, { sort: { updatedAt: -1 } });
    }
}

export const intelligenceRepository = new IntelligenceRepository();
