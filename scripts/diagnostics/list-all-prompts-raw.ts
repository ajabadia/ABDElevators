import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        console.log('--- PROMPTS COLLECTION ---');
        const prompts = await db.collection('prompts').find({}).toArray();
        prompts.forEach(p => {
            console.log(`- Key: ${p.key || p.name}, Tenant: ${p.tenantId}, Env: ${p.environment}, Active: ${p.active}`);
        });

        console.log('\n--- PROMPT_VERSIONS COLLECTION (COUNT) ---');
        const versionsCount = await db.collection('prompt_versions').countDocuments();
        console.log(`Total versions: ${versionsCount}`);

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

main();
