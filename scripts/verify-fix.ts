import { callGeminiMini, generateEmbedding } from '../src/lib/llm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyModels() {
    console.log('🧪 Iniciando verificación de modelos...\n');
    const correlationId = '00000000-0000-0000-0000-000000000000';
    const tenantId = 'test_tenant';

    try {
        console.log('1. Testing "gemini-2.5-flash" (Direct)...');
        const res1 = await callGeminiMini('Hello, respond only OK', tenantId, { correlationId, model: 'gemini-2.5-flash' });
        console.log('   ✅ Response:', res1);

        console.log('\n2. Testing Mapping "gemini-3-flash-preview" -> Fallback...');
        const res2 = await callGeminiMini('Hello, respond only MAPPED', tenantId, { correlationId, model: 'gemini-3-flash-preview' });
        console.log('   ✅ Response:', res2);

        console.log('\n3. Testing Embeddings (text-embedding-004)...');
        const emb = await generateEmbedding('Test text', tenantId, correlationId);
        console.log(`   ✅ Dimensions: ${emb.length}`);

        const fs = require('fs');
        fs.writeFileSync('verification_output.txt', '🎉 All basic models verified successfully.\n');
    } catch (error: any) {
        const fs = require('fs');
        const msg = `❌ Verification error (SIMPLE):\n${error.message || error.toString()}\n`;
        fs.writeFileSync('verification_output.txt', msg);
    }
}

verifyModels();
