import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env.local');

// Manual extraction to be safe
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
};

const uris = {
    Main: getEnv('MONGODB_URI'),
    Auth: getEnv('MONGODB_AUTH_URI') || getEnv('MONGODB_URI'),
    Logs: getEnv('MONGODB_LOGS_URI') || getEnv('MONGODB_URI')
};

async function checkCluster(uri: string | undefined, label: string) {
    if (!uri) {
        console.log(`\n[${label}] URI is missing`);
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

            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();

            for (const col of collections) {
                const colName = col.name;

                // Check for logs
                if (colName.toLowerCase().includes('log')) {
                    const logs = await db.collection(colName)
                        .find({ level: 'ERROR' })
                        .sort({ timestamp: -1, createdAt: -1 })
                        .limit(5)
                        .toArray();

                    if (logs.length > 0) {
                        console.log(`\n    --- ERRORS in ${dbName}.${colName} ---`);
                        logs.forEach(l => {
                            console.log(`    [${l.timestamp || l.createdAt}] SOURCE: ${l.source} ACTION: ${l.action}`);
                            console.log(`    MSG: ${l.message}`);
                            if (l.stack) console.log(`    STACK:\n${l.stack.substring(0, 1000)}`);
                            if (l.details) console.log(`    DETAILS: ${JSON.stringify(l.details, null, 2)}`);
                            console.log('    -----------------------------------');
                        });
                    }
                }

                // Check for abd_global
                if (colName === 'tenants') {
                    const abd = await db.collection(colName).findOne({ tenantId: 'abd_global' });
                    if (abd) {
                        console.log(`\n    [FOUND] abd_global in ${dbName}.tenants`);
                        console.log(`    Branding keys: ${abd.branding ? Object.keys(abd.branding).join(', ') : 'NONE'}`);
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
    for (const [label, uri] of Object.entries(uris)) {
        await checkCluster(uri, label);
    }
}

run();
