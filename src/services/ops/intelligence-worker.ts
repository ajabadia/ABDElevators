
import { connectDB, connectLogsDB } from '@/lib/db';
import { FederatedKnowledgeService } from '@/services/core/FederatedKnowledgeService';
import { IndustryType } from '@/lib/schemas';

/**
 * SOVEREIGN ENGINE - Stage 1: Autonomous Knowledge Discovery
 * 
 * This worker scans application logs for successful ticket resolutions
 * and automatically generalizes them into the Federated Knowledge Network.
 */
export class IntelligenceWorker {

    /**
     * Executes one cycle of log analysis.
     * Can be triggered by a CRON job or a specific admin action.
     */
    static async runDiscoveryCycle(): Promise<{ processed: number, extracted: number }> {
        console.log('[IntelligenceWorker] Starting discovery cycle...');

        const db = await connectDB();
        const logsDb = await connectLogsDB();

        // 1. Get the last processed log timestamp to be idempotent
        const metadataCol = db.collection('intelligence_metadata');
        const lastRun = await metadataCol.findOne({ id: 'discovery_worker' });
        const lastTimestamp = lastRun?.lastProcessedTimestamp || new Date(0);

        // 2. Query for successful ticket resolutions since last run
        // We look for logs where a ticket was resolved with a solution
        const logsCol = logsDb.collection('application_logs');
        const candidateLogs = await logsCol.find({
            action: 'TICKET_RESOLVED_SUCCESS',
            timestamp: { $gt: lastTimestamp },
            'details.resolution': { $exists: true },
            'details.description': { $exists: true }
        }).sort({ timestamp: 1 }).limit(50).toArray(); // Process in batches of 50

        if (candidateLogs.length === 0) {
            console.log('[IntelligenceWorker] No new logs to process.');
            return { processed: 0, extracted: 0 };
        }

        let extractedCount = 0;
        let latestTimestamp = lastTimestamp;

        for (const log of candidateLogs) {
            const { description, resolution, industry, tenantId } = log.detalles;

            console.log(`[IntelligenceWorker] Processing log ${log._id} from tenant ${tenantId}...`);

            try {
                const pattern = await FederatedKnowledgeService.extractPatternFromResolution(
                    description,
                    resolution,
                    tenantId,
                    (industry as IndustryType) || 'ELEVATORS'
                );

                if (pattern) {
                    extractedCount++;
                    console.log(`[IntelligenceWorker] ✅ Pattern extracted: ${pattern.problemVector}`);
                }
            } catch (err) {
                console.error(`[IntelligenceWorker] ❌ Failed to process log ${log._id}:`, err);
            }

            latestTimestamp = log.timestamp;
        }

        // 3. Update last processed timestamp
        await metadataCol.updateOne(
            { id: 'discovery_worker' },
            { $set: { lastProcessedTimestamp: latestTimestamp, updatedAt: new Date() } },
            { upsert: true }
        );

        console.log(`[IntelligenceWorker] Cycle complete. Processed: ${candidateLogs.length}, Extracted: ${extractedCount}`);
        return { processed: candidateLogs.length, extracted: extractedCount };
    }
}
