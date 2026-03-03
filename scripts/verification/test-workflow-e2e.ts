
import { connectDB } from '@/lib/db';
import { getTenantCollection } from '@/lib/db-tenant';
import { compileGraphToLogic } from '@/lib/workflow-compiler';
import { WorkflowEngine } from '@/core/engine/WorkflowEngine';
import { Node, Edge } from '@xyflow/react';
import dotenv from 'dotenv';
import path from 'path';

// Load Environment Variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runTest() {
    console.log('🚀 Starting Phase 50 E2E Test...');

    const TENANT_ID = 'test-tenant-e2e';
    const TEST_EMAIL = 'admin@test.com';

    // 1. Setup DB
    await connectDB();
    const workflowsCol = await getTenantCollection('ai_workflows' as any, { user: { tenantId: TENANT_ID } }); // Using loose typing for collection name if strictly typed

    // Clean previous tests
    await workflowsCol.deleteMany({ name: 'E2E Test Workflow' });

    // 2. Define Visual Graph (Mocking the UI Output)
    // Logic: If Risk < 50 -> Log Message
    const nodes: Node[] = [
        {
            id: 'node-1',
            type: 'trigger',
            data: { label: 'Risk Score' },
            position: { x: 0, y: 0 }
        },
        {
            id: 'node-2',
            type: 'condition',
            data: { label: 'Score < 50' }, // Compiler looks for '<'
            position: { x: 200, y: 0 }
        },
        {
            id: 'node-3',
            type: 'action',
            data: { label: 'Log Incident to DB' },
            position: { x: 400, y: 0 }
        }
    ];

    const edges: Edge[] = [
        { id: 'e1-2', source: 'node-1', target: 'node-2' },
        { id: 'e2-3', source: 'node-2', target: 'node-3' } // Assuming linear flow implies "True" path
    ];

    // 3. Compile Graph
    console.log('📦 Compiling Visual Graph...');
    const compiledLogic = compileGraphToLogic(nodes, edges, 'E2E Test Workflow', TENANT_ID);

    console.log('✅ Compiled Logic Trigger:', JSON.stringify(compiledLogic.trigger, null, 2));
    console.log('✅ Compiled Logic Actions:', JSON.stringify(compiledLogic.actions, null, 2));

    // 4. Save to DB (Simulating API)
    await workflowsCol.insertOne({
        ...compiledLogic,
        visual: { nodes, edges },
        createdAt: new Date(),
        createdBy: TEST_EMAIL
    } as any);
    console.log('💾 Workflow Saved to DB.');

    // 5. Run Engine - Scenario A: Should Trigger (Score 40 < 50)
    console.log('\n🧪 Testing Scenario A: Risk Score = 40 (Should Trigger)...');
    const engine = WorkflowEngine.getInstance();

    // We mock the logEvento to see output cleanly or rely on console logs in Engine
    await engine.processEvent(
        'on_entity_change',
        { riskScore: 40, entityId: 'elevator-123' },
        TENANT_ID,
        'trace-id-1'
    );

    // 6. Run Engine - Scenario B: Should NOT Trigger (Score 80 > 50)
    console.log('\n🧪 Testing Scenario B: Risk Score = 80 (Should IGNORE)...');
    await engine.processEvent(
        'on_entity_change',
        { riskScore: 80, entityId: 'elevator-123' },
        TENANT_ID,
        'trace-id-2'
    );

    console.log('\n🎉 E2E Test Completed. Check logs above for "EXECUTE_WORKFLOW".');
    process.exit(0);
}

runTest().catch(async (e) => {
    console.error('TEST FAILED:', e);
    const fs = require('fs');
    fs.writeFileSync('d:/desarrollos/ABDElevators/e2e_error.txt', `ERROR: ${e.message}\nSTACK: ${e.stack}`);
    process.exit(1);
});
