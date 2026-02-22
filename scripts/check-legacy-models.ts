import { connectDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkLegacyModels() {
    try {
        const db = await connectDB();
        const prompts = await db.collection('prompts').find({ model: { $regex: /gemini-1\.5/ } }).toArray();
        console.log(`🔍 Found ${prompts.length} prompts with gemini-1.5`);
        prompts.forEach(p => console.log(`   - Key: ${p.key}, Model: ${p.model}, Tenant: ${p.tenantId}`));

        const aiConfigs = await db.collection('ai_configs').find({
            $or: [
                { defaultModel: { $regex: /gemini-1\.5/ } },
                { fallbackModel: { $regex: /gemini-1\.5/ } }
            ]
        }).toArray();
        console.log(`🔍 Found ${aiConfigs.length} ai_configs with gemini-1.5`);
        aiConfigs.forEach(c => console.log(`   - Tenant: ${c.tenantId}, Default: ${c.defaultModel}, Fallback: ${c.fallbackModel}`));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking models:', error);
        process.exit(1);
    }
}

checkLegacyModels();
