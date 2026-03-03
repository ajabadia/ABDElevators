import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listModels() {
    try {
        if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Use v1beta to list models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();

        console.log("📋 Available Gemini Models:");
        if (data.models) {
            data.models.forEach((m: any) => {
                console.log(`   - ${m.name}`);
            });
        } else {
            console.log("   No models found or error in response:", JSON.stringify(data));
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error listing models:', error);
        process.exit(1);
    }
}

listModels();
