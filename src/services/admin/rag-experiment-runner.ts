import { ragExperimentRepository } from '@/lib/repositories/RagExperimentRepository';
import { ragOfflineExperimentResultRepository } from '@/lib/repositories/RagOfflineExperimentResultRepository';
import { goldenSetRepository } from '@/lib/repositories/GoldenSetRepository';
import { hybridSearch, hierarchicalSearch } from '@abd/rag-engine/server';
import { RagJudgeService } from '@/services/core/rag-judge-service';
import { getSystemSession } from '@/lib/sessions/system-session';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { ObjectId } from 'mongodb';
import { type RagOfflineExperiment, type RagOfflineExperimentResult } from '@/lib/schemas';

/**
 * 🔬 RagExperimentRunner
 * Phase 310: Pipeline for offline comparison of RAG variants.
 */
export class RagExperimentRunner {
    /**
     * Executes a full experiment against a golden set.
     */
    static async runExperiment(experimentId: string, tenantId: string, externalCorrelationId: string) {
        return withCorrelation(
            {
                level: 'INFO',
                source: 'RAG_EXPERIMENT_RUNNER',
                action: 'RUN_EXPERIMENT',
                tenantId,
                correlationId: externalCorrelationId
            },
            async ({ log, correlationId }) => {
                const session = getSystemSession(tenantId);

                const experiment = await ragExperimentRepository.getEntity(experimentId, session as any) as unknown as RagOfflineExperiment;
                
                // Update status to RUNNING
                await ragExperimentRepository.update(experimentId, { $set: { status: 'RUNNING' } } as any, session as any);

                const queries = await goldenSetRepository.list({ tenantId } as any, {}, session as any) as any[];

                for (const variant of experiment.variants) {
                    for (const queryEntry of queries) {
                        try {
                            const start = Date.now();
                            let responseText = '';
                            let retrievedChunkIds: string[] = [];

                            // 1. Execute RAG based on version
                            if (variant.engineVersion === 'v2') {
                                const results = await hierarchicalSearch(queryEntry.query, tenantId, correlationId, variant.config);
                                responseText = results.context; 
                                retrievedChunkIds = results.sources.map(s => s.chunkId).filter(id => id !== undefined) as string[];
                            } else {
                                const results = await hybridSearch(queryEntry.query, tenantId, correlationId, 'GENERIC', variant.config);
                                retrievedChunkIds = results.map(s => s.chunkId).filter(id => id !== undefined) as string[];
                                responseText = results.map(r => r.text).join('\n\n'); 
                            }

                            // 2. Calculate Context Metrics (Recall)
                            const groundTruthIds = queryEntry.groundTruthContextIds || [];
                            const hits = retrievedChunkIds.filter(id => groundTruthIds.includes(id)).length;
                            const recall = groundTruthIds.length > 0 ? hits / groundTruthIds.length : 1;

                            // 3. LLM Evaluation (Faithfulness / Relevance)
                            const evalResult = await RagJudgeService.evaluateResponse(
                                queryEntry.query,
                                responseText, 
                                queryEntry.groundTruthAnswer || "N/A", 
                                'GENERIC',
                                tenantId,
                                correlationId
                            );

                            // 4. Persist Result
                            if (!experiment._id || !queryEntry._id) continue;

                            await ragOfflineExperimentResultRepository.create({
                                experimentId: experiment._id!.toString() as any,
                                queryId: queryEntry._id!.toString() as any,
                                variantId: variant.id,
                                metrics: {
                                    ...evalResult.metrics,
                                    context_recall: recall
                                },
                                durationMs: Date.now() - start,
                                timestamp: new Date()
                            } as any, session as any);

                        } catch (error: unknown) {
                            console.error(`[RagExperimentRunner] Error in query ${queryEntry._id} for variant ${variant.id}:`, error);
                        }
                    }
                }

                // Update status to COMPLETED
                await ragExperimentRepository.update(experimentId, {
                    $set: { status: 'COMPLETED', completedAt: new Date() } as any
                } as any, session as any);

                await log({
                    message: `Experiment ${experiment.name} completed for tenant ${tenantId}`,
                    details: { experimentId: experiment._id }
                });
            }
        );
    }
}
