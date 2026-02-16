import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkAllDatabases() {
    if (!MONGODB_URI) {
        console.error('MONGODB_URI is missing');
        return;
    }

    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const dbs = await client.db().admin().listDatabases();
        console.log('Available databases:', dbs.databases.map(d => d.name));

        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            if (dbName === 'admin' || dbName === 'local' || dbName === 'config') continue;

            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();
            console.log(`Database: ${dbName}, Collections:`, collections.map(c => c.name));

            // Look for log collections
            for (const col of collections) {
                if (col.name.toLowerCase().includes('log')) {
                    console.log(`--- Checking logs in ${dbName}.${col.name} ---`);
                    const logs = await db.collection(col.name)
                        .find({ level: 'ERROR' })
                        .sort({ timestamp: -1 })
                        .limit(5)
                        .toArray();

                    logs.forEach(l => {
                        console.log(`[${l.timestamp || l.createdAt}] SOURCE: ${l.source} ACTION: ${l.action}`);
                        console.log(`MESSAGE: ${l.message}`);
                        if (l.stack) console.log(`STACK: ${l.stack.substring(0, 300)}...`);
                        console.log('---');
                    });
                }

                if (col.name === 'tenants') {
                    console.log(`--- Checking ${dbName}.tenants ---`);
                    const abd = await db.collection('tenants').findOne({ tenantId: 'abd_global' });
                    if (abd) {
                        console.log('abd_global found in tenants collection of', dbName);
                        // Print keys to see if schema matches
                        console.log('Keys:', Object.keys(abd));
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.close();
    }
}

checkAllDatabases();
