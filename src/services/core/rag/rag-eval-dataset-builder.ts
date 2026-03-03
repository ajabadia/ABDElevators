import { connectDB, logEvento } from '@abd/platform-core/server';

/**
 * Service to build a "golden" evaluation dataset from high-quality RAG feedback.
 */
export class RagEvalDatasetBuilder {
    /**
     * Builds evaluation triples from positive feedback and saves them to rag_eval_dataset.
     */
    static async buildDataset(correlationId: string): Promise<{ created: number }> {
        const db = await connectDB();
        const feedbackColl = db.collection('rag_feedback');
        const datasetColl = db.collection('rag_eval_dataset');

        // Look for thumbs_up feedback that hasn't been added to dataset yet
        const positiveFeedback = await feedbackColl.find({
            type: 'thumbs_up',
            datasetProcessed: { $ne: true }
        }).toArray();

        let createdCount = 0;

        for (const feedback of positiveFeedback) {
            try {
                const { question, answer, chunkIds, tenantId } = feedback;

                // We need question and answer at minimum
                if (!question || !answer) continue;

                // Check if already exists in dataset (simple deduplication by question)
                const existing = await datasetColl.findOne({ question, tenantId });
                if (existing) {
                    await feedbackColl.updateOne({ _id: feedback._id }, { $set: { datasetProcessed: true, skipReason: 'duplicate_in_dataset' } });
                    continue;
                }

                await datasetColl.insertOne({
                    question,
                    expectedAnswer: answer,
                    sourceChunkIds: chunkIds || [],
                    sourceFeedbackId: feedback._id,
                    tenantId,
                    difficulty: 'HARD', // HITL means it's usually worth tracking
                    createdAt: new Date(),
                    version: '1.0'
                });

                await feedbackColl.updateOne({ _id: feedback._id }, { $set: { datasetProcessed: true } });
                createdCount++;
            } catch (error: unknown) {
                console.error(`[RagEvalDatasetBuilder] Error building dataset from feedback ${feedback._id}:`, error);
            }
        }

        if (createdCount > 0) {
            await logEvento({
                level: 'INFO',
                source: 'RAG_EVAL_DATASET_BUILDER',
                action: 'DATASET_EXTENDED',
                message: `Added ${createdCount} new entries to RAG evaluation dataset`,
                correlationId,
                details: { entriesCreated: createdCount }
            });
        }

        return { created: createdCount };
    }
}
