import * as dotenv from 'dotenv';
import path from 'path';
import { AgenticRAGService } from '../src/lib/langgraph-rag';
import { connectDB } from '../src/lib/db';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testAgenticRAG() {
    console.log('🧪 Iniciando Test de Agente RAG (LangGraph)...\n');

    // Conectar DB para que los servicios funcionen
    await connectDB();

    const tenantId = process.env.SINGLE_TENANT_ID || 'default_tenant';
    const query = "¿Qué precauciones de seguridad debo tener con el modelo de puerta Quantum?";
    const correlacion_id = "550e8400-e29b-41d4-a716-446655440000";

    try {
        console.log(`🔍 Pregunta: "${query}"`);
        const result = await AgenticRAGService.run(query, tenantId, correlacion_id);

        console.log('\n--- RESULTADO DE GENERACIÓN ---');
        console.log(result.generation);
        console.log('\n--- METADATOS DEL FLUJO ---');
        console.log(`Documentos recuperados: ${result.documents.length}`);
        console.log(`Re-intentos (Query Rewrites): ${result.retry_count}`);

        // Esperar un poco para que la evaluación en background termine
        console.log('\n⏳ Esperando evaluación automática...');
        await new Promise(r => setTimeout(r, 10000));

        const db = await connectDB();
        const evaluation = await db.collection('rag_evaluations').findOne({ correlationId: correlacion_id});

        if (evaluation) {
            console.log('\n✅ EVALUACIÓN ENCONTRADA:');
            console.log(JSON.stringify(evaluation.metrics, null, 2));
        } else {
            console.log('\n⚠️ No se encontró evaluación (puede estar lenta o haber fallado por cuota).');
        }

    } catch (error: any) {
        console.error('❌ Error en test:', error);
        if (error.stack) console.error(error.stack);
    }
}

testAgenticRAG();
