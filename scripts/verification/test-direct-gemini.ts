import { getGenAI, mapModelName } from '../src/lib/gemini-client';
import { DEFAULT_MODEL } from '../src/lib/constants/ai-models';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testDirect() {
    try {
        console.log(`🚀 Testing Direct Gemini Call...`);
        console.log(`   Model mapping: ${DEFAULT_MODEL} -> ${mapModelName(DEFAULT_MODEL)}`);

        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: mapModelName(DEFAULT_MODEL) });

        const result = await model.generateContent("Respond with 'PONG'");
        console.log(`✅ Success! Response: ${result.response.text()}`);
        process.exit(0);
    } catch (error: any) {
        console.error(`❌ Direct Call Failed:`, error);
        process.exit(1);
    }
}

testDirect();
