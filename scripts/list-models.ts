
import * as dotenv from 'dotenv';
import * as path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listModels() {
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY not found');
        return;
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    console.log('--- LISTING AVAILABLE MODELS ---\n');
    try {
        // We use a dummy model to get the genAI object if needed, 
        // but the SDK has a listModels method on the client? 
        // Actually, the standard way in Node SDK is genAI.getGenerativeModel({model: '...'}) 
        // but to list models we might need a direct fetch or check documentation.
        // The @google/generative-ai doesn't have a direct listModels yet? 
        // Let's check the REST API via fetch as a fallback.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();

        if (data.models) {
            console.log('Available Models:');
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.log('No models found or error in response:', data);
        }
    } catch (error: any) {
        console.error('Error listing models:', error.message);
    }
    process.exit(0);
}

listModels();
