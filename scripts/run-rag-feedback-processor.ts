import { logEvento } from '@abd/platform-core/server';
import { RagFeedbackProcessor } from '../src/services/core/rag/rag-feedback-processor';
import { RagEvalDatasetBuilder } from '../src/services/core/rag/rag-eval-dataset-builder';

async function main() {
    const correlationId = crypto.randomUUID();
    console.log(`🚀 Starting RAG Feedback Processor... (ID: ${correlationId})`);

    try {
        await logEvento({
            level: 'INFO',
            source: 'OPS_JOB',
            action: 'RAG_FEEDBACK_JOB_START',
            message: 'Starting nightly RAG feedback processing job',
            correlationId
        });

        const feedbackResult = await RagFeedbackProcessor.processPendingFeedback(correlationId);
        console.log(`✅ Feedback processing complete: ${feedbackResult.processed} processed, ${feedbackResult.failures} failures.`);

        const datasetResult = await RagEvalDatasetBuilder.buildDataset(correlationId);
        console.log(`📊 Dataset builder complete: ${datasetResult.created} new entries added.`);

        await logEvento({
            level: 'INFO',
            source: 'OPS_JOB',
            action: 'RAG_FEEDBACK_JOB_END',
            message: 'RAG feedback processing job finished successfully',
            correlationId,
            details: { ...feedbackResult, datasetCreated: datasetResult.created }
        });

    } catch (error: unknown) {
        console.error('❌ Fatal error in feedback job:', error);
        await logEvento({
            level: 'ERROR',
            source: 'OPS_JOB',
            action: 'RAG_FEEDBACK_JOB_FATAL',
            message: 'Critical failure in feedback processing job',
            correlationId,
            details: { error: error instanceof Error ? error.message : String(error) }
        });
        process.exit(1);
    } finally {
        console.log('🏁 Job finished.');
        process.exit(0);
    }
}

main();
