import dotenv from 'dotenv';
import path from 'path';
import { callGeminiMini } from '../lib/llm';
import { AI_MODEL_IDS } from '@abd/platform-core';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testModels() {
    console.log('🧪 Testing Model Connectivity...');
    const models = [
        AI_MODEL_IDS.GEMINI_1_5_PRO,
        AI_MODEL_IDS.GEMINI_2_5_FLASH
    ];

    for (const model of models) {
        try {
            console.log(`Testing ${model}...`);
            const res = await callGeminiMini("Hello, respond with OK", "platform_master", {
                correlationId: `test-${model}`,
                model
            });
            console.log(`✅ ${model}: ${res}`);
        } catch (err: any) {
            console.error(`❌ ${model} failed:`, err.message);
        }
    }
}

testModels();
