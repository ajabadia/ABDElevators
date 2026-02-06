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

        const all = await collection.find({}).toArray();
        console.log(`Total prompts: ${all.length}`);

        // Group by tenantId
        const counts: Record<string, number> = {};
        all.forEach(p => {
            counts[p.tenantId] = (counts[p.tenantId] || 0) + 1;
        });
        console.log('Counts by tenantId:', counts);

        // Check specific keys
        const targets = ['GRAPH_EXTRACTOR', 'QUERY_ENTITY_EXTRACTOR', 'RAG_JUDGE', 'QUERY_EXPANDER'];
        all.filter(p => targets.includes(p.key)).forEach(p => {
            console.log(`Key: ${p.key}, Tenant: ${p.tenantId}, Active: ${p.active}, Env: ${p.environment}`);
        });

    } finally {
        await client.close();
    }
}

main();
