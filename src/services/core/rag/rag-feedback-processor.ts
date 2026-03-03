import { ObjectId } from 'mongodb';
import { connectDB, logEvento } from '@abd/platform-core/server';

/**
 * Service to process RAG feedback and update document chunk scores.
 */
export class RagFeedbackProcessor {
    /**
     * Processes pending feedback records and updates corresponding chunk feedbackScore.
     */
    static async processPendingFeedback(correlationId: string): Promise<{ processed: number; failures: number }> {
        const db = await connectDB();
        const feedbackColl = db.collection('rag_feedback');
        const chunksColl = db.collection('document_chunks');

        const pendingFeedback = await feedbackColl.find({ processed: false }).toArray();
        let processedCount = 0;
        let failureCount = 0;

        for (const feedback of pendingFeedback) {
            try {
                const { chunkIds, type } = feedback;
                if (!chunkIds || !Array.isArray(chunkIds) || chunkIds.length === 0) {
                    await feedbackColl.updateOne({ _id: feedback._id }, { $set: { processed: true, skipReason: 'no_chunk_ids' } });
                    continue;
                }

                const scoreDelta = type === 'thumbs_up' ? 1 : -1;

                // Update chunks in bulk
                const objectIds = chunkIds.map(id => {
                    try { return new ObjectId(id); } catch { return null; }
                }).filter(id => id !== null) as ObjectId[];

                if (objectIds.length > 0) {
                    await chunksColl.updateMany(
                        { _id: { $in: objectIds } },
                        { $inc: { feedbackScore: scoreDelta } }
                    );
                }

                await feedbackColl.updateOne({ _id: feedback._id }, { $set: { processed: true, processedAt: new Date() } });
                processedCount++;
            } catch (error: unknown) {
                failureCount++;
                console.error(`[RagFeedbackProcessor] Error processing feedback ${feedback._id}:`, error);
                await logEvento({
                    level: 'ERROR',
                    source: 'RAG_FEEDBACK_PROCESSOR',
                    action: 'PROCESS_ERROR',
                    message: `Failed to process feedback ${feedback._id}`,
                    correlationId,
                    details: { error: error instanceof Error ? error.message : String(error) }
                });
            }
        }

        return { processed: processedCount, failures: failureCount };
    }
}
