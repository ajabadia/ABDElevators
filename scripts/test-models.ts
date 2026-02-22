import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { AI_MODEL_IDS } from '../src/lib/constants/ai-models';
dotenv.config();

async function testConfiguredModels() {
    console.log("🚀 Testing configured contractual models...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    const modelsToTest = [
        AI_MODEL_IDS.GEMINI_2_5_FLASH,
        AI_MODEL_IDS.GEMINI_2_5_PRO,
        AI_MODEL_IDS.GEMINI_3_PRO_PREVIEW
    ];

    for (const modelId of modelsToTest) {
        try {
            console.log(`Testing ${modelId}...`);
            const model = genAI.getGenerativeModel({ model: modelId });
            const result = await model.generateContent("test");
            console.log(`✅ ${modelId} is AVAILABLE`);
        } catch (e: any) {
            console.error(`❌ ${modelId} FAILED:`, e.message);
        }
    }
}

testConfiguredModels();
