import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) return;

    const client = new MongoClient(uri);
    try {
        await client.connect();

        // List all databases
        const dbs = await client.db().admin().listDatabases();
        console.log('--- DATABASES ---');
        for (const dbInfo of dbs.databases) {
            console.log(`Database: ${dbInfo.name}`);
            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            collections.forEach(c => console.log(`   Collection: ${c.name}`));
        }

    } finally {
        await client.close();
    }
}

main();
