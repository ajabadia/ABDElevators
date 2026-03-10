import { getTenantCollection } from '@/lib/db';
import {
    RagOfflineExperimentSchema,
    RagOfflineExperimentResultSchema,
    type RagOfflineExperiment,
    type RagGoldenSet
} from '@/lib/schemas';
import { hybridSearch, hierarchicalSearch } from '@abd/rag-engine/server';
import { RagJudgeService } from '@/services/core/rag-judge-service';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';

/**
 * 🔬 RagExperimentRunner
 * Phase 310: Pipeline for offline comparison of RAG variants.
 */
export class RagExperimentRunner {
    /**
     * Executes a full experiment against a golden set.
     */
    static async runExperiment(experimentId: string, tenantId: string, correlationId: string) {
        const db = await (await import('@abd/platform-core/server')).connectDB();
        const experimentsColl = await getTenantCollection('rag_offline_experiments');
        const resultsColl = await getTenantCollection('rag_offline_experiment_results');
        const goldenSetColl = await getTenantCollection('rag_golden_sets');

        const experiment = await experimentsColl.findOne({ _id: new ObjectId(experimentId), tenantId }) as unknown as RagOfflineExperiment;
        if (!experiment || !experiment._id) throw new Error('Experiment not found or missing ID');

        // Update status to RUNNING
        await experimentsColl.updateOne({ _id: experiment._id as any }, { $set: { status: 'RUNNING' } });

        const queriesCursor = goldenSetColl.find({ tenantId });
        const queries = await (queriesCursor as any).toArray() as unknown as RagGoldenSet[];

        for (const variant of experiment.variants) {
            for (const queryEntry of queries) {
                try {
                    const start = Date.now();
                    let responseText = '';
                    let retrievedChunkIds: string[] = [];

                    // 1. Execute RAG based on version
                    if (variant.engineVersion === 'v2') {
                        const results = await hierarchicalSearch(queryEntry.query, tenantId, correlationId, variant.config);
                        responseText = results.context; // Note: In a real test we'd need a generation step, 
                        // but here we evaluate the retrieval context or a mock generation.
                        retrievedChunkIds = results.sources.map(s => s.chunkId).filter(id => id !== undefined) as string[];
                    } else {
                        const results = await hybridSearch(queryEntry.query, tenantId, correlationId, 'GENERIC', variant.config);
                        retrievedChunkIds = results.map(s => s.chunkId).filter(id => id !== undefined) as string[];
                        responseText = results.map(r => r.text).join('\n\n'); // Mock generation from context
                    }

                    // 2. Calculate Context Metrics (Recall)
                    const groundTruthIds = queryEntry.groundTruthContextIds || [];
                    const hits = retrievedChunkIds.filter(id => groundTruthIds.includes(id)).length;
                    const recall = groundTruthIds.length > 0 ? hits / groundTruthIds.length : 1;

                    // 3. LLM Evaluation (Faithfulness / Relevance)
                    const evalResult = await RagJudgeService.evaluateResponse(
                        queryEntry.query,
                        responseText, // For offline contexts we use the joined text
                        queryEntry.groundTruthAnswer || "N/A", // We can compare vs Ground Truth Answer
                        'GENERIC',
                        tenantId,
                        correlationId
                    );

                    // 4. Persist Result
                    if (!experiment._id || !queryEntry._id) continue;

                    const resultDoc = RagOfflineExperimentResultSchema.parse({
                        experimentId: experiment._id.toString(),
                        queryId: queryEntry._id.toString(),
                        variantId: variant.id,
                        metrics: {
                            ...evalResult.metrics,
                            context_recall: recall
                        },
                        durationMs: Date.now() - start,
                        timestamp: new Date()
                    });

                    await resultsColl.insertOne(resultDoc as any);

                } catch (error: unknown) {
                    console.error(`[RagExperimentRunner] Error in query ${queryEntry._id} for variant ${variant.id}:`, error);
                }
            }
        }

        // Update status to COMPLETED
        await experimentsColl.updateOne({
            _id: experiment._id
        }, {
            $set: { status: 'COMPLETED', completedAt: new Date() }
        });

        await logEvento({
            level: 'INFO',
            source: 'RAG_EXPERIMENT_RUNNER',
            action: 'EXPERIMENT_COMPLETED',
            message: `Experiment ${experiment.name} completed for tenant ${tenantId}`,
            tenantId,
            correlationId,
            details: { experimentId: experiment._id }
        });
    }
}
