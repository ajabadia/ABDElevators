import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../lib/db';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkPrompts() {
    const db = await connectDB();
    const collection = db.collection('prompts');

    console.log('--- Prompts for demo-tenant ---');
    const prompts = await collection.find({ tenantId: 'demo-tenant' }).toArray();
    console.log(`Found ${prompts.length} prompts`);

    prompts.forEach(p => {
        console.log(`Key: ${p.key}, Industry: ${p.industry}, Env: ${p.environment}, Active: ${p.active}, ID: ${p._id}`);
    });

    console.log('\n--- Searching specifically for CAUSAL_IMPACT_ANALYSIS ---');
    const specific = await collection.findOne({ key: 'CAUSAL_IMPACT_ANALYSIS', tenantId: 'demo-tenant' });
    if (specific) {
        console.log('✅ Found CAUSAL_IMPACT_ANALYSIS');
        console.log(JSON.stringify(specific, null, 2));
    } else {
        console.log('❌ NOT FOUND CAUSAL_IMPACT_ANALYSIS for demo-tenant');
    }

    process.exit(0);
}

checkPrompts();
