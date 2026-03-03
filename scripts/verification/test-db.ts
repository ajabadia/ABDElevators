import dotenv from 'dotenv';
import path from 'path';
import { MongoClient } from 'mongodb';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testConnection() {
    console.log('🔍 Testing MongoDB Connection...');
    const uri = process.env.MONGODB_URI;
    console.log('URI present:', !!uri);

    if (!uri) return;

    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('✅ Connected successfully to MongoDB');
        const db = client.db('ABDElevators');
        const count = await db.collection('prompts').countDocuments({ tenantId: 'demo-tenant' });
        console.log('📊 Prompts found for demo-tenant:', count);

        const causalPrompt = await db.collection('prompts').findOne({ key: 'CAUSAL_IMPACT_ANALYSIS', tenantId: 'demo-tenant' });
        console.log('📑 Causal Prompt exists:', !!causalPrompt);
    } catch (err) {
        console.error('❌ Connection failed:', err);
    } finally {
        await client.close();
    }
}

testConnection();
