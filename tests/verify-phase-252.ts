import { connectDB } from '@abd/platform-core/server';
import { ObjectId } from 'mongodb';
import { RagFeedbackProcessor } from '../src/services/core/rag/rag-feedback-processor';
import { RagEvalDatasetBuilder } from '../src/services/core/rag/rag-eval-dataset-builder';

async function verify() {
    console.log('🧪 Starting Verification for Phase 252...');
    const correlationId = 'test-' + Date.now();
    const db = await connectDB();

    // 1. Create a dummy chunk
    const chunksColl = db.collection('document_chunks');
    const chunkId = new ObjectId();
    await chunksColl.insertOne({
        _id: chunkId,
        chunkText: 'Test content for feedback loop',
        tenantId: 'test_tenant',
        feedbackScore: 0
    });
    console.log('✅ Dummy chunk created.');

    // 2. Mock a feedback submission
    const feedbackColl = db.collection('rag_feedback');
    await feedbackColl.insertOne({
        answerId: 'test-ans-123',
        type: 'thumbs_up',
        question: 'What is this test?',
        answer: 'This is a test answer for feedback loop',
        documentSource: 'test.pdf',
        chunkIds: [chunkId.toString()],
        tenantId: 'test_tenant',
        processed: false,
        createdAt: new Date()
    });
    console.log('✅ Mock feedback inserted.');

    // 3. Run Processor
    console.log('⚙️ Running RagFeedbackProcessor...');
    await RagFeedbackProcessor.processPendingFeedback(correlationId);

    const updatedChunk = await chunksColl.findOne({ _id: chunkId });
    if (updatedChunk?.feedbackScore === 1) {
        console.log('✅ Chunk feedbackScore updated successfully.');
    } else {
        console.error('❌ Chunk feedbackScore NOT updated correctly:', updatedChunk?.feedbackScore);
    }

    // 4. Run Dataset Builder
    console.log('⚙️ Running RagEvalDatasetBuilder...');
    await RagEvalDatasetBuilder.buildDataset(correlationId);

    const datasetEntry = await db.collection('rag_eval_dataset').findOne({ question: 'What is this test?' });
    if (datasetEntry) {
        console.log('✅ Evaluation dataset entry created successfully.');
    } else {
        console.error('❌ Evaluation dataset entry NOT found.');
    }

    // Cleanup
    await chunksColl.deleteOne({ _id: chunkId });
    await feedbackColl.deleteMany({ tenantId: 'test_tenant' });
    await db.collection('rag_eval_dataset').deleteMany({ tenantId: 'test_tenant' });
    console.log('🧹 Cleanup complete.');

    process.exit(0);
}

verify().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
