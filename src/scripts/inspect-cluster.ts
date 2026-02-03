
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspectCluster() {
    console.log('🌍 Cluster-wide Inspection...');

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('No MONGODB_URI found');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('📡 Connected successfully');

        const dbs = await client.db().admin().listDatabases();
        console.log('\n--- Databases ---');
        for (const dbInfo of dbs.databases) {
            console.log(`Database: ${dbInfo.name}`);
            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            console.log(`  Collections: ${collections.map(c => c.name).join(', ')}`);

            for (const coll of collections) {
                const count = await db.collection(coll.name).countDocuments();
                if (count > 0) {
                    console.log(`    - ${coll.name}: ${count} docs`);
                }
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

inspectCluster();
