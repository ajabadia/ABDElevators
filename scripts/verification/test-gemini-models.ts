
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';
import { AIMODELIDS } from '../src/lib/ai-models';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testModel(modelName: string) {
    console.log(`\n--- Testing model: ${modelName} ---`);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        const result = await model.generateContent("Respond only with 'OK'");
        const response = result.response.text();
        console.log(`✅ Success! Response: ${response}`);
        return true;
    } catch (error: any) {
        console.error(`❌ Failed: ${error.message}`);
        if (error.response) {
            console.error('Full response error:', JSON.stringify(error.response, null, 2));
        }
        return false;
    }
}

async function run() {
    const models = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        AIMODELIDS.RAG_GENERATOR,
        AIMODELIDS.REPORT_GENERATOR,
        AIMODELIDS.WORKFLOW_ROUTER
    ];

    for (const model of models) {
        await testModel(model);
    }
}

run();
