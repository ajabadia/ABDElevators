import { getTenantCollection } from '@/lib/db-tenant';
import { getSystemSession } from '@/lib/sessions/system-session';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * Service to build a "golden" evaluation dataset from high-quality RAG feedback.
 */
export class RagEvalDatasetBuilder {
    /**
     * Builds evaluation triples from positive feedback and saves them to rag_eval_dataset.
     */
    static async buildDataset(correlationId: string): Promise<{ created: number }> {
        return await withCorrelation(
            { level: 'INFO', source: 'RAG_EVAL_DATASET_BUILDER', action: 'BUILD_DATASET', correlationId },
            async ({ log }) => {
                const sysSession = getSystemSession();
                const feedbackColl = await getTenantCollection('rag_feedback', sysSession, 'LOGS');
                
                // Look for thumbs_up feedback that hasn't been added to dataset yet
                const positiveFeedback = await (feedbackColl as any).unsecureRawCollection.find({
                    type: 'thumbs_up',
                    datasetProcessed: { $ne: true }
                }).toArray();

                let createdCount = 0;

                for (const feedback of positiveFeedback) {
                    try {
                        const { question, answer, chunkIds, tenantId } = feedback;
                        if (!question || !answer) continue;

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
                            difficulty: 'HARD',
                            createdAt: new Date(),
                            version: '1.0'
                        } as any);

                        await feedbackColl.updateOne({ _id: feedback._id }, { $set: { datasetProcessed: true } });
                        createdCount++;
                    } catch (error: unknown) {
                        await log({
                            level: 'ERROR',
                            message: `Error building dataset from feedback ${feedback._id}`,
                            details: { error: error instanceof Error ? error.message : String(error) }
                        });
                    }
                }

                if (createdCount > 0) {
                    await log({
                        action: 'DATASET_EXTENDED',
                        message: `Added ${createdCount} new entries to RAG evaluation dataset`,
                        details: { entriesCreated: createdCount }
                    });
                }

                return { created: createdCount };
            }
        );
    }
}
