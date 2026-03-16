
import { connectDB, connectLogsDB } from '@/lib/db';
import { FederatedKnowledgeService } from '@/services/core/FederatedKnowledgeService';
import { RagResult } from "@abd/rag-engine";
import { PromptRunner } from '@/lib/llm-core/PromptRunner';
import { RagService } from '@/services/core/RagService';
import { IndustryType } from '@/lib/schemas';
import { z } from 'zod';
import { logEvento } from '@/lib/logger';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';

const FaqSchema = z.object({
    question: z.string(),
    answer: z.string()
});

const QualityEvalSchema = z.object({
    faithfulness: z.number(),
    answer_relevance: z.number(),
    context_precision: z.number(),
    reasoning: z.string(),
    causal_analysis: z.object({
        cause_id: z.string(),
        fix_strategy: z.string()
    })
});

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
    private static async log(data: { level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', action: string, message: string, correlationId?: string, tenantId?: string, details?: any }) {
        return logEvento({
            source: 'INTELLIGENCE_WORKER',
            ...data
        });
    }

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
            const { description, resolution, industry, tenantId } = log.details || log.detalles;

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

    /**
     * SOVEREIGN ENGINE - Stage 2: Autonomous FAQ Generation (Phase 255.1)
     * 
     * Scans PUBLISHED federated patterns that have not been converted into FAQs,
     * uses LLM to format them as clear Q&A, and injects them into the RAG engine.
     */
    static async generateFAQsFromPatterns(tenantId: string = 'system_generated'): Promise<{ processed: number, generated: number }> {
        const correlationId = CorrelationIdService.generate();
        console.log(`[IntelligenceWorker] Starting FAQ generation cycle. Correlation: ${correlationId}`);

        const db = await connectDB();
        const patternsCol = db.collection('federated_patterns');

        const candidatePatterns = await patternsCol.find({
            status: 'PUBLISHED',
            hasGeneratedFAQ: { $ne: true },
            $or: [
                { confidenceScore: { $gte: 0.85 } },
                { validationCount: { $gt: 0 } }
            ]
        }).limit(20).toArray();

        if (candidatePatterns.length === 0) {
            console.log('[IntelligenceWorker] No new patterns for FAQ generation.');
            return { processed: 0, generated: 0 };
        }

        const { IngestIndexer } = await import('@/services/ingest/IngestIndexer');
        let generatedCount = 0;

        for (const pattern of candidatePatterns) {
            try {
                // 1. Generate FAQ format using PromptRunner (Gobernanza de Prompts)
                const faqData = await PromptRunner.runJson({
                    key: 'AUTONOMOUS_FAQ_GENERATOR',
                    variables: {
                        problemVector: pattern.problemVector,
                        solutionVector: pattern.solutionVector
                    },
                    schema: FaqSchema,
                    tenantId,
                    correlationId
                });

                const faqText = `Q: ${faqData.question}\nA: ${faqData.answer}`;

                // 2. Inject into RAG engine via IngestIndexer
                const assetMeta: any = {
                    tenantId,
                    filename: `AutoFAQ_${pattern._id}.md`,
                    usage: 'REFERENCE',
                    componentType: 'FAQ_AUTO',
                    model: 'GENERIC',
                    environment: 'PRODUCTION'
                };

                await IngestIndexer.index(
                    faqText,
                    [],
                    assetMeta,
                    "Autonomous technical FAQ generated from resolved field tickets.",
                    pattern.originIndustry || 'GENERIC',
                    'es',
                    correlationId,
                    undefined,
                    undefined,
                    'SIMPLE'
                );

                // 3. Mark pattern as processed
                await patternsCol.updateOne(
                    { _id: pattern._id },
                    { $set: { hasGeneratedFAQ: true, faqGeneratedAt: new Date() } }
                );

                generatedCount++;
            } catch (err: unknown) {
                console.error(`[IntelligenceWorker] ❌ Failed to generate FAQ from pattern ${pattern._id}:`, err);
            }
        }

        return { processed: candidatePatterns.length, generated: generatedCount };
    }

    /**
     * SOVEREIGN ENGINE - Stage 2: Retrieval Quality Monitoring (Phase 255.2)
     * 
     * Runs silent evaluations using the 'golden' dataset to detect drift.
     */
    static async monitorRetrievalQuality(tenantId: string = 'system_generated'): Promise<{ tested: number, avgFaithfulness: number }> {
        const correlationId = CorrelationIdService.generate();
        const db = await connectDB();
        const datasetCol = db.collection('rag_eval_dataset');

        // Sample 10 items from the golden dataset
        const samples = await datasetCol.aggregate([{ $sample: { size: 10 } }]).toArray();

        if (samples.length === 0) return { tested: 0, avgFaithfulness: 0 };

        let totalFaithfulness = 0;
        let testedCount = 0;

        for (const sample of samples) {
            try {
                // 1. Execute RAG Retrieval
                const searchResults = await RagService.performTechnicalSearch(
                    sample.question,
                    tenantId as any,
                    correlationId,
                    5,
                    'GENERIC'
                );

                const context = (searchResults as RagResult[]).map((r) => r.text).join('\n---\n');

                // 2. Evaluate with RAG_JUDGE
                const evaluation = await PromptRunner.runJson({
                    key: 'RAG_JUDGE',
                    variables: {
                        query: sample.question,
                        context,
                        response: sample.expectedAnswer,
                        vertical: 'Elevators'
                    },
                    schema: QualityEvalSchema,
                    tenantId,
                    correlationId
                });

                totalFaithfulness += evaluation.faithfulness;
                testedCount++;

                // 3. Conditional Alerting
                if (evaluation.faithfulness < 0.7) {
                    await this.log({
                        level: 'WARN',
                        action: 'RETRIVAL_MAINTENANCE_REQUIRED',
                        message: `Low faithfulness detected for question: ${sample.question.substring(0, 50)}...`,
                        correlationId,
                        details: {
                            evaluation,
                            sampleId: sample._id
                        }
                    });
                }
            } catch (err) {
                console.error(`[IntelligenceWorker] ❌ Quality evaluation failed for ${sample._id}:`, err);
            }
        }

        const avgFaithfulness = testedCount > 0 ? totalFaithfulness / testedCount : 0;

        await this.log({
            level: avgFaithfulness > 0.8 ? 'INFO' : 'WARN',
            action: 'RETRIVAL_QUALITY_MONITOR_COMPLETE',
            message: `Retrieval Monitoring: Avg Faithfulness is ${(avgFaithfulness * 100).toFixed(1)}%`,
            correlationId,
            details: { testedCount, avgFaithfulness }
        });

        return { tested: testedCount, avgFaithfulness };
    }
}
