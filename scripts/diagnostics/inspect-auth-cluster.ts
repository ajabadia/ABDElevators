import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
};

const authUri = getEnv('MONGODB_AUTH_URI');

async function inspectAuthCluster() {
    if (!authUri) {
        console.error('MONGODB_AUTH_URI is missing');
        return;
    }

    console.log(`Inspecting Auth Cluster: ${authUri.split('@')[1]}`);
    const client = new MongoClient(authUri);
    try {
        await client.connect();
        const dbs = await client.db().admin().listDatabases();
        console.log('Databases:', dbs.databases.map(d => d.name));

        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;

            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();
            console.log(`DB [${dbName}] Collections:`, collections.map(c => c.name));

            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`  - ${col.name}: ${count} docs`);

                if (col.name === 'tenants') {
                    const sample = await db.collection(col.name).findOne({});
                    console.log(`    Sample doc IDs:`, (await db.collection(col.name).find({}, { projection: { tenantId: 1 } }).toArray()).map(t => t.tenantId));
                }
            }
        }
    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        await client.close();
    }
}

inspectAuthCluster();
