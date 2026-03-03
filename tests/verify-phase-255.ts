import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { connectDB } from '@abd/platform-core/server';
import { IntelligenceWorker } from '../src/services/ops/intelligence-worker';
import { ObjectId } from 'mongodb';

async function verify() {
    console.log('🧪 Starting Verification for Phase 255...');
    const db = await connectDB();
    const tenantId = 'test_tenant_255';

    // 1. Setup Federated Pattern for FAQ Generation
    const patternsCol = db.collection('federated_patterns');
    const patternId = new ObjectId();
    await patternsCol.insertOne({
        _id: patternId,
        problemVector: 'Test problem description for elevators: Motor is vibrating too much.',
        solutionVector: 'Check the mounting bolts and balance the rotor.',
        status: 'PUBLISHED',
        confidenceScore: 0.95,
        tenantId,
        hasGeneratedFAQ: false,
        createdAt: new Date()
    });
    console.log('✅ Mock pattern created.');

    // 2. Setup Eval Dataset for Monitoring
    const datasetCol = db.collection('rag_eval_dataset');
    await datasetCol.insertOne({
        question: 'What should I check if the elevator motor vibrates?',
        expectedAnswer: 'You should check the mounting bolts and balance the rotor.',
        tenantId,
        createdAt: new Date()
    });
    console.log('✅ Mock eval dataset entry created.');

    // 3. Run FAQ Generation
    console.log('⚙️ Running generateFAQsFromPatterns...');
    try {
        const faqResult = await IntelligenceWorker.generateFAQsFromPatterns(tenantId);
        console.log(`✅ FAQ Result: Processed ${faqResult.processed}, Generated ${faqResult.generated}`);

        const patternAfter = await patternsCol.findOne({ _id: patternId });
        if (patternAfter?.hasGeneratedFAQ) {
            console.log('✅ Pattern marked as FAQ generated.');
        } else {
            console.error('❌ Pattern NOT marked as FAQ generated.');
        }
    } catch (err) {
        console.error('❌ FAQ Generation failed:', err);
    }

    // 4. Run Quality Monitoring
    console.log('⚙️ Running monitorRetrievalQuality...');
    try {
        const monitorResult = await IntelligenceWorker.monitorRetrievalQuality(tenantId);
        console.log(`✅ Monitor Result: Tested ${monitorResult.tested}, Avg Faithfulness: ${monitorResult.avgFaithfulness}`);
    } catch (err) {
        console.error('❌ Quality Monitoring failed:', err);
    }

    // Cleanup
    await patternsCol.deleteOne({ _id: patternId });
    await datasetCol.deleteMany({ tenantId });
    const chunksCol = db.collection('document_chunks');
    await chunksCol.deleteMany({ tenantId });

    console.log('🧹 Cleanup complete.');
    process.exit(0);
}

verify().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
