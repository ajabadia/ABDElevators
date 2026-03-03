import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.0-flash-exp'
    ];

    for (const modelName of modelsToTry) {
        console.log(`--- Testing model: ${modelName} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hi');
            console.log(`✅ ${modelName} OK:`, (await result.response).text());
            break; // Stop if one works
        } catch (e: any) {
            console.error(`❌ ${modelName} Error:`, e.message);
        }
    }
}

testGemini();
