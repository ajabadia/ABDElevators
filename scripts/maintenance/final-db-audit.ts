
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function finalAudit() {
    const uris = {
        MAIN: process.env.MONGODB_URI,
    };

    for (const [name, uri] of Object.entries(uris)) {
        if (!uri) continue;
        const client = new MongoClient(uri);
        try {
            await client.connect();
            const db = client.db('ABDElevators');
            const collections = await db.listCollections().toArray();
            console.log(`\n=== MAIN DATABASE AUDIT ===`);
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                const sample = await db.collection(col.name).findOne({});
                console.log(`Collection: ${col.name} (${count} docs)`);
                if (sample) {
                    console.log(`  Fields: ${Object.keys(sample).join(', ')}`);
                }
            }
        } catch (e) {
            console.error(`Error:`, e);
        } finally {
            await client.close();
        }
    }
}

finalAudit();
