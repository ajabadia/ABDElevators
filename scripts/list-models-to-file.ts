import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        const models = data.models ? data.models.map((m: any) => m.name).join('\n') : "No models found";
        fs.writeFileSync('scripts/models_list.txt', models);
        console.log("✅ Models written to scripts/models_list.txt");
        process.exit(0);
    } catch (error) {
        console.error('❌ Error listing models:', error);
        process.exit(1);
    }
}

listModels();
