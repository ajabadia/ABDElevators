import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Force load from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_AUTH_URI = process.env.MONGODB_AUTH_URI;
const MONGODB_LOGS_URI = process.env.MONGODB_LOGS_URI;

async function checkCluster(uri: string | undefined, label: string) {
    if (!uri) {
        console.error(`[${label}] URI is missing in .env.local`);
        return;
    }

    console.log(`\n=== Scanning Cluster: ${label} ===`);
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const dbs = await client.db().admin().listDatabases();

        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;

            console.log(`\n  > DB: ${dbName}`);
            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();

            for (const col of collections) {
                const colName = col.name;

                // 1. Check for logs
                if (colName.toLowerCase().includes('log')) {
                    console.log(`    - Checking logs in ${colName}...`);
                    const errors = await db.collection(colName)
                        .find({ level: 'ERROR' })
                        .sort({ timestamp: -1 })
                        .limit(3)
                        .toArray();

                    if (errors.length > 0) {
                        errors.forEach(e => {
                            console.log(`      [ERR] ${e.timestamp || e.createdAt} | ${e.source} | ${e.action}`);
                            console.log(`      Msg: ${e.message}`);
                            if (e.stack) console.log(`      Stack: ${e.stack.substring(0, 200)}...`);
                        });
                    }
                }

                // 2. Check for abd_global config
                if (colName === 'tenants') {
                    const abd = await db.collection(colName).findOne({ tenantId: 'abd_global' });
                    if (abd) {
                        console.log(`    - [FOUND] abd_global in ${colName}`);
                        console.log(`      Fields: ${Object.keys(abd).join(', ')}`);
                    } else {
                        console.log(`    - [MISSING] abd_global in ${colName}`);
                    }
                }
            }
        }
    } catch (e: any) {
        console.error(`[${label}] Error:`, e.message);
    } finally {
        await client.close();
    }
}

async function run() {
    await checkCluster(MONGODB_URI, 'Main Cluster');
    await checkCluster(MONGODB_AUTH_URI, 'Auth Cluster');
    await checkCluster(MONGODB_LOGS_URI, 'Logs Cluster');
}

run();
