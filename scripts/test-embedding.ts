import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testEmbedding() {
    const fs = require('fs');
    try {
        console.log('🔍 Testing Embeddings...');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent("Hello world");
        console.log(`✅ Embedding Works! Length: ${result.embedding.values.length}`);
        fs.writeFileSync('embedding_output.txt', `✅ Embedding Works! Length: ${result.embedding.values.length}`);
    } catch (error: any) {
        console.log(`❌ Embedding Failed: ${error.message}`);
        fs.writeFileSync('embedding_output.txt', `❌ Embedding Failed: ${error.message}`);
    }
}

testEmbedding();
