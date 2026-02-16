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

        const all = await db.collection('prompts').find({}).toArray();
        console.log(`Total prompts: ${all.length}`);

        const grouped: Record<string, any[]> = {};
        all.forEach(p => {
            const groupKey = `${p.tenantId} | ${p.environment}`;
            if (!grouped[groupKey]) grouped[groupKey] = [];
            grouped[groupKey].push(p.key || p.name);
        });

        console.log('--- GROUPS (Tenant | Env) ---');
        for (const [group, keys] of Object.entries(grouped)) {
            console.log(`${group}: ${keys.length} prompts`);
            console.log(`  Keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
        }

    } finally {
        await client.close();
    }
}

main();
