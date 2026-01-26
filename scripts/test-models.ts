import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // La librería no tiene un método directo cómodo para listar sin pasar por fetch o rest
        // Pero intentaremos llamar a uno estándar
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('hi');
        console.log('FLASH OK');
    } catch (e: any) {
        console.log('FLASH ERROR:', e.message);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model2 = genAI.getGenerativeModel({ model: 'gemini-pro' });
            await model2.generateContent('hi');
            console.log('GEMINI-PRO OK');
        } catch (e2: any) {
            console.log('GEMINI-PRO ERROR:', e2.message);
        }
    }
}
listModels();
