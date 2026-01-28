import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listModels() {
    console.log('🔍 Listing available models...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    // Using a trick: try to get a model and ask for info, or use listModels if available in this SDK version?
    // @google/generative-ai typically exposing ModelManager in newer versions, but let's try to infer from error or documentation.
    // Actually, currently most users use curl to list models because SDK support for listing varies.
    // BUT, we can try to test a few known candidates.

    const fs = require('fs');
    let output = '🔍 Listing available models...\n';

    const candidates = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-001',
        'gemini-1.5-flash-002',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-1.0-pro'
    ];

    for (const modelName of candidates) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test");
            console.log(`✅ ${modelName} IS AVAILABLE`);
            output += `✅ ${modelName} IS AVAILABLE\n`;
        } catch (error: any) {
            // console.log(`❌ ${modelName} failed: ${error.message.split('\n')[0]}`);
            if (error.message.includes('404')) {
                console.log(`❌ ${modelName}: Not Found (404)`);
                output += `❌ ${modelName}: Not Found (404)\n`;
            } else {
                console.log(`⚠️ ${modelName}: Error ${error.message.split('\n')[0]}`);
                output += `⚠️ ${modelName}: Error ${error.message.split('\n')[0]}\n`;
            }
        }
    }
    fs.writeFileSync('models_output.txt', output);
}

listModels();
