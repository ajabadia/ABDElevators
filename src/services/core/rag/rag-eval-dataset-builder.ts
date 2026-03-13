import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { getSystemSession } from '@/lib/session-utils';

/**
 * Service to build a "golden" evaluation dataset from high-quality RAG feedback.
 */
export class RagEvalDatasetBuilder {
    /**
     * Builds evaluation triples from positive feedback and saves them to rag_eval_dataset.
     */
    static async buildDataset(correlationId: string): Promise<{ created: number }> {
        // Use system session for background processing
        const sysSession = getSystemSession();
        
        const feedbackColl = await getTenantCollection('rag_feedback', sysSession, 'LOGS');
        const datasetColl = await getTenantCollection('rag_eval_dataset', sysSession, 'LOGS');

        // Look for thumbs_up feedback that hasn't been added to dataset yet
        const positiveFeedback = await (feedbackColl as any).unsecureRawCollection.find({
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
                // Use the specific tenantId from feedback for the dataset lookup
                const tenantSession = getSystemSession(tenantId);
                const tenantDatasetColl = await getTenantCollection('rag_eval_dataset', tenantSession, 'LOGS');
                
                const existing = await tenantDatasetColl.findOne({ question });
                if (existing) {
                    await feedbackColl.updateOne({ _id: feedback._id }, { $set: { datasetProcessed: true, skipReason: 'duplicate_in_dataset' } });
                    continue;
                }

                await tenantDatasetColl.insertOne({
                    question,
                    expectedAnswer: answer,
                    sourceChunkIds: chunkIds || [],
                    sourceFeedbackId: feedback._id,
                    tenantId,
                    difficulty: 'HARD', // HITL means it's usually worth tracking
                    createdAt: new Date(),
                    version: '1.0'
                } as any);

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
