import { callGeminiMini, generateEmbedding } from '../src/lib/llm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyModels() {
    console.log('🧪 Iniciando verificación de modelos...\n');
    const correlacion_id = '00000000-0000-0000-0000-000000000000';
    const tenantId = 'test_tenant';

    try {
        console.log('1. Probando "gemini-1.5-flash" (Directo)...');
        const res1 = await callGeminiMini('Hola, responde solo OK', tenantId, { correlacion_id, model: 'gemini-1.5-flash' });
        console.log('   ✅ Respuesta:', res1);

        console.log('\n2. Probando Mapeo "gemini-3-flash-preview" -> Fallback...');
        const res2 = await callGeminiMini('Hola, responde solo MAPPED', tenantId, { correlacion_id, model: 'gemini-3-flash-preview' });
        console.log('   ✅ Respuesta:', res2);

        console.log('\n3. Probando Embeddings (text-embedding-004)...');
        const emb = await generateEmbedding('Test text', tenantId, correlacion_id);
        console.log(`   ✅ Dimensiones: ${emb.length}`);

        const fs = require('fs');
        fs.writeFileSync('verification_output.txt', '🎉 Todos los modelos básicos verificados exitosamente.\n');
    } catch (error: any) {
        const fs = require('fs');
        const msg = `❌ Error en verificación (SIMPLE):\n${error.message || error.toString()}\n`;
        fs.writeFileSync('verification_output.txt', msg);
    }
}

verifyModels();
