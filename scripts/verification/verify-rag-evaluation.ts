
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Avoid auth import issues
process.env.SINGLE_TENANT_ID = 'default_tenant';

async function verifyRagEvaluation() {
    console.log('--- VERIFYING RAG EVALUATION FRAMEWORK (PHASE 61.4) ---');

    const { RagEvaluationService } = await import('../services/rag-evaluation-service');
    const { v4: uuidv4 } = await import('uuid');

    const tenantId = "test-tenant-eval";
    const correlationId = uuidv4();

    // 1. MOCK RAG DATA
    const query = "¿Cuál es el código de error para fallo de comunicación en el ARCA-DRIVE?";
    const response = "El código de error para fallo de comunicación en el inverter ARCA-DRIVE es E04.";
    const contexts = [
        "Capítulo 4: Diagnóstico de Averías. El error E04 indica un fallo de comunicación en el bus CAN del ARCA-DRIVE.",
        "Manual de Instalación: Verifique el cableado de red entre la placa principal y el inverter si ve el código E04."
    ];

    console.log('\n1. Sending data to LLM Judge...');
    const evaluation = await RagEvaluationService.evaluateQuery(
        correlationId,
        query,
        response,
        contexts,
        tenantId
    );

    if (evaluation && evaluation.metrics) {
        console.log('✅ Evaluation Successful!');
        console.log('📊 Metrics:');
        console.log(`   - Faithfulness: ${evaluation.metrics.faithfulness}`);
        console.log(`   - Relevance: ${evaluation.metrics.answer_relevance}`);
        console.log(`   - Precision: ${evaluation.metrics.context_precision}`);
        console.log(`📝 Reasoning: ${evaluation.feedback}`);
    } else {
        console.log('❌ Evaluation failed. Check logs for errors.');
    }

    // 2. TEST AGGREGATION
    console.log('\n2. Testing Metrics Aggregation...');
    const metrics = await RagEvaluationService.getMetrics(tenantId);

    if (metrics.summary.totalEvaluated > 0) {
        console.log(`✅ Aggregation works! Total evaluated for tenant: ${metrics.summary.totalEvaluated}`);
        console.log(`📈 Average Faithfulness: ${metrics.summary.avgFaithfulness.toFixed(2)}`);
    } else {
        console.log('❌ Aggregation returned no data.');
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
    process.exit(0);
}

verifyRagEvaluation().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});
