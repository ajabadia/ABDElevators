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
        console.log(`Total prompts in DB: ${all.length}`);

        all.forEach((p, i) => {
            console.log(`${i + 1}. [${p.key || p.name}]`);
            console.log(`   Name: ${p.name}`);
            console.log(`   Tenant: ${p.tenantId}`);
            console.log(`   Env: ${p.environment}`);
            console.log(`   Active: ${p.active}`);
            console.log(`   Category: ${p.category}`);
            console.log('-------------------');
        });

    } finally {
        await client.close();
    }
}

main();
