import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testGemini() {
    console.log('🧪 Testing Gemini Connection...');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in .env.local');
        return;
    }
    console.log('🔑 API Key found:', apiKey.substring(0, 5) + '...');

    const genAI = new GoogleGenerativeAI(apiKey);

    // Test: Gemini 2.5 (User request)
    try {
        console.log('Testing gemini-2.5-flash...');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent('Say Hello');
        console.log('Success 2.5!', result.response.text());
    } catch (error: any) {
        console.log('ERROR 2.5:', error.message);
    }

    // Test: Gemini 3.0 (User request)
    try {
        console.log('Testing gemini-3.0-flash...');
        const model = genAI.getGenerativeModel({ model: 'gemini-3.0-flash' });
        const result = await model.generateContent('Say Hello');
        console.log('Success 3.0!', result.response.text());
    } catch (error: any) {
        console.log('ERROR 3.0:', error.message);
    }
}

testGemini();
