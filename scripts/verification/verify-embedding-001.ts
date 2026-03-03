import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyEmbedding001() {
    console.log('🧪 Verificando embedding-001...\n');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const fs = require('fs');
    let output = '';

    const modelsToTest = ['embedding-001'];

    for (const modelName of modelsToTest) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const res = await model.embedContent("Hello world");
            const msg = `✅ ${modelName}: OK (Embedding size: ${res.embedding.values.length})`;
            console.log(msg);
            output += msg + '\n';

        } catch (error: any) {
            const msg = `❌ ${modelName}: ${error.message.split('\n')[0]}`;
            console.log(msg);
            output += msg + '\n';
        }
    }

    fs.writeFileSync('embedding_verification.txt', output);
}

verifyEmbedding001();
