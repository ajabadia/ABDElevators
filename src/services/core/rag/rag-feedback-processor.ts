import { ObjectId } from 'mongodb';
import { getTenantCollection } from '@/lib/db-tenant';
import { getSystemSession } from '@/lib/sessions/system-session';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * Service to process RAG feedback and update document chunk scores.
 */
export class RagFeedbackProcessor {
    /**
     * Processes pending feedback records and updates corresponding chunk feedbackScore.
     */
    static async processPendingFeedback(correlationId: string): Promise<{ processed: number; failures: number }> {
        return await withCorrelation(
            { level: 'INFO', source: 'RAG_FEEDBACK_PROCESSOR', action: 'PROCESS_FEEDBACK', correlationId },
            async ({ log }) => {
                const sysSession = getSystemSession();
                const feedbackColl = await getTenantCollection('rag_feedback', sysSession, 'LOGS');

                // Use unsecure for the global scan but process each with its tenant context
                const pendingFeedback = await (feedbackColl as any).unsecureRawCollection.find({ processed: false }).toArray();
                let processedCount = 0;
                let failureCount = 0;

                for (const feedback of pendingFeedback) {
                    try {
                        const { chunkIds, type, tenantId } = feedback;
                        if (!chunkIds || !Array.isArray(chunkIds) || chunkIds.length === 0) {
                            await feedbackColl.updateOne({ _id: feedback._id }, { $set: { processed: true, skipReason: 'no_chunk_ids' } });
                            continue;
                        }

                        const scoreDelta = type === 'thumbs_up' ? 1 : -1;

                        // Update chunks in bulk with tenant isolation
                        const tenantSession = getSystemSession(tenantId);
                        const chunksColl = await getTenantCollection('document_chunks', tenantSession, 'MAIN');

                        const objectIds = chunkIds.map(id => {
                            try { return new ObjectId(id); } catch { return null; }
                        }).filter(id => id !== null) as ObjectId[];

                        if (objectIds.length > 0) {
                            await chunksColl.updateMany(
                                { _id: { $in: objectIds } } as any,
                                { $inc: { feedbackScore: scoreDelta } } as any
                            );
                        }

                        await feedbackColl.updateOne({ _id: feedback._id }, { $set: { processed: true, processedAt: new Date() } });
                        processedCount++;
                    } catch (error: unknown) {
                        failureCount++;
                        await log({
                            level: 'ERROR',
                            message: `Failed to process feedback ${feedback._id}`,
                            details: { error: error instanceof Error ? error.message : String(error) }
                        });
                    }
                }

                return { processed: processedCount, failures: failureCount };
            }
        );
    }
}
