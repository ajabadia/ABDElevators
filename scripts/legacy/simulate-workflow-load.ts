import { WorkflowAnalyticsService } from '../lib/workflow-analytics-service';
import { connectDB } from '../lib/db';

async function simulate() {
    console.log('🚀 Starting Workflow Analytics Anomaly Simulation...');

    const workflowId = 'workflow_demo_1';
    const tenantId = 'tenant_1';

    const nodes = [
        { id: 'trigger_1', type: 'trigger', label: 'Incendio Detectado', baseDuration: 50 },
        { id: 'action_1', type: 'action', label: 'Notificar Bomberos', baseDuration: 150 },
        { id: 'ai-analyzer', type: 'action', label: 'Analizar Riesgo AI', baseDuration: 300 },
        { id: 'action_2', type: 'action', label: 'Bloquear Ascensores', baseDuration: 1000 }
    ];

    // Generate 150 events over the last 24 hours
    console.log('📊 Injecting events with a 30% error rate in ai-analyzer...');

    for (let i = 0; i < 150; i++) {
        const correlationId = `sim-p54-${i}`;

        for (const node of nodes as any[]) {
            let status: 'SUCCESS' | 'FAILED' | 'SKIPPED' = 'SUCCESS';
            let durationMs = node.baseDuration + (Math.random() * 50);

            // Simulate ANOMALY in 'ai-analyzer'
            if (node.id === 'ai-analyzer') {
                if (Math.random() < 0.3) { // 30% error rate (Anomaly threshold is 15%)
                    status = 'FAILED';
                }
                if (Math.random() < 0.1) { // 10% latency spikes
                    durationMs *= 4; // 4x latency spike
                }
            }

            await WorkflowAnalyticsService.recordEvent({
                workflowId,
                nodeId: node.id,
                tenantId,
                type: node.type,
                status,
                durationMs,
                correlationId
            });
        }

        if (i % 50 === 0) console.log(`...processed ${i} iterations`);
    }

    console.log('✅ Simulation completed. Anomalies should be visible in Analysis Mode.');
    process.exit(0);
}

simulate().catch(err => {
    console.error('❌ Simulation failed:', err);
    process.exit(1);
});
