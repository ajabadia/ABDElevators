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

        const prompts = await collection.find({ tenantId: 'default_tenant' }).toArray();

        console.log(`Total prompts for default_tenant: ${prompts.length}`);
        prompts.forEach(p => {
            console.log(JSON.stringify({
                key: p.key || p.name,
                active: p.active,
                environment: p.environment,
                deletedAt: p.deletedAt,
                version: p.version
            }, null, 2));
        });

    } finally {
        await client.close();
    }
}

main();
