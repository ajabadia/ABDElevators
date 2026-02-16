
import { WorkflowEngine } from '../core/engine/WorkflowEngine';
import { compileGraphToLogic } from '../lib/workflow-compiler';
import { connectDB } from '../lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verify() {
    console.log('🧪 Starting RAG-Driven Workflow E2E Verification...');

    const tenantId = 'test_tenant_rag_driven';
    const correlationId = `test-rag-${Date.now()}`;

    // 1. Define a graph: Trigger -> Switch -> Human Task
    const nodes: any[] = [
        { id: 'trigger_1', type: 'trigger', data: { label: 'New Extraction' } },
        { id: 'switch_1', type: 'switch', data: { label: 'Check RAG Confidence', criteria: { confidenceThreshold: 0.85 } } },
        { id: 'action_1', type: 'action', data: { label: 'Manual Validation Task' } }
    ];

    const edges: any[] = [
        { id: 'e1-2', source: 'trigger_1', target: 'switch_1' },
        { id: 'e2-3', source: 'switch_1', target: 'action_1' }
    ];

    // 2. Compile
    console.log('⚙️ Compiling RAG-driven graph...');
    const compiled = compileGraphToLogic(nodes as any, edges as any, 'RAG Driven Validation', tenantId);

    // Save to DB
    const db = await connectDB();
    const collection = db.collection('ai_workflows');
    await collection.updateOne(
        { id: compiled.id },
        { $set: { ...compiled, active: true } },
        { upsert: true }
    );

    console.log('🚀 Triggering engine execution with LOW CONFIDENCE data...');
    const engine = WorkflowEngine.getInstance();

    // Data with LOW confidence (0.45 < 0.85)
    const eventData = {
        id: 'case_rag_001',
        confidenceScore: 0.45,
        reason: 'Ambiguous entity detected in PDF'
    };

    await engine.processEvent('on_entity_change', eventData, tenantId, correlationId);

    console.log('🔍 Verifying if Human Task was created...');
    const taskCollection = db.collection('workflow_tasks');
    const task = await taskCollection.findOne({
        tenantId,
        caseId: 'case_rag_001',
        title: 'Manual Validation Task'
    });

    if (task) {
        console.log('✅ SUCCESS: Human task created successfully!');
        console.log('Task Details:', {
            id: task._id,
            status: task.status,
            assignedRole: task.assignedRole,
            description: task.description
        });
    } else {
        console.error('❌ FAILURE: Human task was NOT created!');
        process.exit(1);
    }

    process.exit(0);
}

verify().catch(err => {
    console.error('❌ Verification failed!');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('Status:', err.status);
    console.error('Details:', err.details);
    if (err.stack) console.error('Stack:', err.stack);
    process.exit(1);
});
