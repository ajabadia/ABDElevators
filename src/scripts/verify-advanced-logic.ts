
import { AIWorkflowEngine } from '../core/engine/AIWorkflowEngine';
import { compileGraphToLogic } from '../lib/workflow-compiler';
import { connectDB } from '../lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verify() {
    console.log('🧪 Starting Advanced Workflow E2E Verification...');

    const tenantId = 'test_tenant_advanced';
    const correlationId = `test-adv-${Date.now()}`;

    // 1. Define a complex graph (Visual Representation)
    const nodes: any[] = [
        { id: 'trigger_1', type: 'trigger', data: { label: 'New Ticket' } },
        { id: 'wait_1', type: 'wait', data: { label: 'Hold for 2s', duration: 2, unit: 's' } },
        { id: 'switch_1', type: 'switch', data: { label: 'Critical Switch' } },
        { id: 'action_1', type: 'action', data: { label: 'Alert Slack' } }
    ];

    const edges: any[] = [
        { id: 'e1-2', source: 'trigger_1', target: 'wait_1' },
        { id: 'e2-3', source: 'wait_1', target: 'switch_1' },
        { id: 'e3-4', source: 'switch_1', target: 'action_1' }
    ];

    // 2. Compile
    console.log('⚙️ Compiling graph...');
    const compiled = compileGraphToLogic(nodes as any, edges as any, 'Adv Test Workflow', tenantId);

    // Save to DB so engine can find it
    const db = await connectDB();
    const collection = db.collection('ai_workflows');
    await collection.updateOne(
        { id: compiled.id },
        { $set: { ...compiled, active: true } },
        { upsert: true }
    );

    console.log('🚀 Triggering engine execution...');
    const engine = AIWorkflowEngine.getInstance();

    const startTime = Date.now();
    await engine.processEvent('on_entity_change', { riskScore: 90, id: 'ticket_001' }, tenantId, correlationId);
    const duration = Date.now() - startTime;

    console.log(`⏱️ Execution finished in ${duration}ms`);

    if (duration >= 2000) {
        console.log('✅ SUCCESS: Wait node respected (>= 2000ms)');
    } else {
        console.error('❌ FAILURE: Wait node was ignored!');
    }

    process.exit(0);
}

verify().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
