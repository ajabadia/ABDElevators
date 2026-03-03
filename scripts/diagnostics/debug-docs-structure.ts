import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
};

const mainUri = getEnv('MONGODB_URI');

async function scanDocs() {
    if (!mainUri) return;

    const client = new MongoClient(mainUri);
    try {
        await client.connect();
        const dbs = await client.db().admin().listDatabases();

        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;

            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();
            console.log(`\nDB [${dbName}] Collections:`, collections.map(c => c.name));

            for (const col of collections) {
                const colName = col.name;
                if (colName.includes('document') || colName.includes('asset') || colName.includes('tipo')) {
                    const count = await db.collection(colName).countDocuments();
                    console.log(`  - ${colName}: ${count} docs`);

                    if (count > 0) {
                        const sample = await db.collection(colName).findOne({});
                        console.log(`    Fields: ${Object.keys(sample || {}).join(', ')}`);
                        if (colName.includes('type') || colName.includes('tipo')) {
                            const all = await db.collection(colName).find({}).toArray();
                            console.log(`    Values:`, all.map(t => t.name || t.key || t.label || t.tenantId));
                        }
                    }
                }
            }
        }
    } finally {
        await client.close();
    }
}

scanDocs();
