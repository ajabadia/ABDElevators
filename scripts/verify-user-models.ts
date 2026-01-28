import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyUserModels() {
    console.log('🧪 Verificando modelos indicados por el usuario...\n');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const fs = require('fs');
    let output = '';

    const modelsToTest = [
        'gemini-3-flash',
        'gemini-3-pro',
        'gemini-2.5-flash',
        'gemini-embedding-1.0'
    ];

    for (const modelName of modelsToTest) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });

            if (modelName.includes('embedding')) {
                const res = await model.embedContent("Hello world");
                const msg = `✅ ${modelName}: OK (Embedding size: ${res.embedding.values.length})`;
                console.log(msg);
                output += msg + '\n';
            } else {
                const res = await model.generateContent("Hola, responde solo 'OK'");
                const msg = `✅ ${modelName}: OK`;
                console.log(msg);
                output += msg + '\n';
            }
        } catch (error: any) {
            const msg = `❌ ${modelName}: ${error.message.split('\n')[0]}`;
            console.log(msg);
            output += msg + '\n';
        }
    }

    fs.writeFileSync('user_models_verification.txt', output);
}

verifyUserModels();
