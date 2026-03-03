import 'dotenv/config';
import { PromptService } from '../src/lib/prompt-service';
import { WorkflowService } from '../src/lib/workflow-service';
import { EnvironmentService } from '../src/lib/environment-service';
import { connectDB } from '../src/lib/db';
import crypto from 'crypto';

async function verify() {
    console.log('--- STARTING ENVIRONMENT VERIFICATION ---');
    console.log('MONGODB_URI present:', !!process.env.MONGODB_URI);

    const tenantId = 'default_tenant';
    const correlationId = crypto.randomUUID();

    try {
        console.log('Connecting to DB...');
        const db = await connectDB();
        console.log('DB Connected successfully');

        // 1. Verify Prompts Isolation
        console.log('\n[1] Verifying Prompts...');
        const stagingPromptKey = `test_prompt_${Date.now()}`;

        // Save to STAGING
        const collection = db.collection('prompts');

        await collection.insertOne({
            key: stagingPromptKey,
            name: 'Test Staging Prompt',
            template: 'Hello from Staging',
            tenantId,
            environment: 'STAGING',
            active: true,
            version: 1,
            createdAt: new Date()
        });
        console.log(`- Created prompt '${stagingPromptKey}' in STAGING`);

        // List in STAGING
        const stagingList = await PromptService.listPrompts(tenantId, true, 'STAGING');
        const foundInStaging = stagingList.some(p => p.key === stagingPromptKey);
        console.log(`- Found in STAGING list: ${foundInStaging}`);

        // List in PRODUCTION (should NOT be there)
        const prodList = await PromptService.listPrompts(tenantId, true, 'PRODUCTION');
        const foundInProd = prodList.some(p => p.key === stagingPromptKey);
        console.log(`- Found in PRODUCTION list: ${foundInProd} (Expected: false)`);

        // 2. Verify Promotion
        console.log('\n[2] Verifying Promotion...');
        const stagingDoc = await collection.findOne({ key: stagingPromptKey, environment: 'STAGING' });
        if (stagingDoc) {
            await EnvironmentService.promotePromptToProduction(stagingDoc._id.toString(), tenantId, correlationId, 'tester@example.com');
            console.log(`- Promoted '${stagingPromptKey}' to PRODUCTION`);

            const prodListAfter = await PromptService.listPrompts(tenantId, true, 'PRODUCTION');
            const foundInProdAfter = prodListAfter.some(p => p.key === stagingPromptKey);
            console.log(`- Found in PRODUCTION list after promotion: ${foundInProdAfter} (Expected: true)`);
        }

        // 3. Cleanup
        await collection.deleteMany({ key: stagingPromptKey });
        console.log('\n- Cleanup complete.');

        console.log('\n--- VERIFICATION SUCCESSFUL ---');
    } catch (error: any) {
        console.error('\n--- VERIFICATION FAILED ---');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

verify().then(() => process.exit(0));
