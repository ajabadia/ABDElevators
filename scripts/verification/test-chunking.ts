import { ChunkingOrchestrator } from '@/lib/chunking/ChunkingOrchestrator';
import { SimpleChunker } from '@/lib/chunking/SimpleChunker';
import { SemanticChunker } from '@/lib/chunking/SemanticChunker'; // Assuming mocks or real if env set
import { config } from 'dotenv';

// Load env for Gemini
config({ path: '.env.local' });

async function runTest() {
    const text = `
    Introducción a la Inteligencia Artificial.
    La IA está transformando el mundo.

    Machine Learning.
    El aprendizaje automático es un subcampo de la IA.
    Permite a las máquinas aprender de los datos.

    Deep Learning.
    Las redes neuronales profundas son poderosas.
    Imitan el cerebro humano.
    `;

    console.log('--- TEST SIMPLE CHUNKING ---');
    const simple = await ChunkingOrchestrator.chunk({
        tenantId: 'test-tenant',
        correlationId: 'test-corr-1',
        level: 'SIMPLE',
        text
    });
    console.log('Simple Chunks:', simple.length);
    simple.forEach(c => console.log(`[${c.metadata.startIndex}-${c.metadata.endIndex}] ${c.text.substring(0, 50)}...`));


    console.log('\n--- TEST SEMANTIC CHUNKING (Mocked if no apiKey) ---');
    try {
        const semantic = await ChunkingOrchestrator.chunk({
            tenantId: 'test-tenant',
            correlationId: 'test-corr-2',
            level: 'SEMANTIC',
            text
        });
        console.log('Semantic Chunks:', semantic.length);
    } catch (e: any) {
        console.log('Semantic Skipped/Failed:', e.message);
    }

    console.log('\n--- TEST LLM CHUNKING (Mocked if no apiKey) ---');
    try {
        const llm = await ChunkingOrchestrator.chunk({
            tenantId: 'test-tenant',
            correlationId: 'test-corr-3',
            level: 'LLM',
            text
        });
        console.log('LLM Chunks:', llm.length);
        llm.forEach(c => console.log(`[${c.metadata.type}] ${c.text.substring(0, 50)}...`));
    } catch (e: any) {
        console.log('LLM Skipped/Failed:', e.message);
    }
}

// Check if being run directly
// if (require.main === module) {
runTest().catch(console.error);
// }
