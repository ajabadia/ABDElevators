import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) return;

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const collection = db.collection('prompts');

        const targets = ['GRAPH_EXTRACTOR', 'QUERY_ENTITY_EXTRACTOR', 'RAG_JUDGE', 'QUERY_EXPANDER'];
        const prompts = await collection.find({ key: { $in: targets } }).toArray();

        console.log('--- TARGET PROMPTS ---');
        prompts.forEach(p => {
            console.log(JSON.stringify({
                key: p.key || p.name,
                tenantId: p.tenantId,
                active: p.active,
                environment: p.environment,
                version: p.version
            }, null, 2));
        });

        console.log('--- TENANTS COURES ---');
        const tenants = await db.collection('tenants').find({}).toArray();
        tenants.forEach(t => {
            console.log(`Tenant: ${t.tenantId}, Name: ${t.name}`);
        });

    } finally {
        await client.close();
    }
}

main();
