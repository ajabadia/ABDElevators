
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Avoid auth import issues
process.env.SINGLE_TENANT_ID = 'default_tenant';

async function verifyGraphRAG() {
    console.log('--- VERIFYING GRAPH-ENHANCED RAG (PHASE 61) ---');

    const { GraphExtractionService } = await import('../services/pendientes/graph-rag/graph-extraction-service');
    const { GraphRetrievalService } = await import('../services/graph-retrieval-service');
    const { hybridSearch } = await import('../lib/rag-service');
    const { v4: uuidv4 } = await import('uuid');

    const tenantId = "test-tenant-graph";
    const correlationId = uuidv4();

    // 1. TEST EXTRACTION
    console.log('\n1. Testing Extraction...');
    const sampleText = `
        La placa ARCA II es el cerebro del ascensor Evolve. 
        Para calibrar la placa Arca II, se requiere el Terminal de Pruebas (T-BT).
        Si aparece el error E04 (Fallo de comunicación), revise el bus CAN entre la placa Arca II y el inverter ARCA-DRIVE.
    `;

    await GraphExtractionService.extractAndPersist(
        sampleText,
        tenantId,
        correlationId,
        { sourceDoc: "manual_test_graph.pdf" }
    );
    console.log('✅ Extraction triggered (check logs for Neo4j persistence).');

    // 2. TEST RETRIEVAL (Graph Context)
    console.log('\n2. Testing Graph Context Retrieval...');
    const query = "¿Qué necesito para calibrar la placa ARCA II?";
    const context = await GraphRetrievalService.getGraphContext(query, tenantId, correlationId);

    if (context && context.nodes.length > 0) {
        console.log('✅ Graph Context Found:');
        console.log(context.textSummary);
    } else {
        console.log('❌ Graph Context Not Found. Ensure Neo4j is running and accessible.');
    }

    // 3. TEST HYBRID SEARCH INTEGRATION
    console.log('\n3. Testing Hybrid Search Integration...');
    // We expect the graph context to be injected as a result
    const results = await hybridSearch(query, tenantId, correlationId, 5);

    const graphResult = results.find(r => r.type === 'GRAPH_CONTEXT');
    if (graphResult) {
        console.log('✅ Graph context successfully injected into Hybrid Search!');
        console.log('   Source:', graphResult.source);
        console.log('   Preview:', graphResult.text.substring(0, 100) + '...');
    } else {
        console.log('⚠️ Graph context not found in hybrid results (might be filtered by re-ranking?).');
        console.log('   Available types:', results.map(r => r.type).join(', '));
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
}

verifyGraphRAG().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});
