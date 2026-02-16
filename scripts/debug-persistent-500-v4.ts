import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env.local');
console.log('Current working directory:', process.cwd());
console.log('Checking for .env.local at:', envPath);
console.log('File exists:', fs.existsSync(envPath));

// Force load from .env.local
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('Dotenv error:', result.error);
}

const MONGODB_URI = process.env.MONGODB_URI;
console.log('MONGODB_URI present:', !!MONGODB_URI);

async function run() {
    if (!MONGODB_URI) {
        console.error('MONGODB_URI is STILL missing');
        // Try fallback if we can read it manually
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const match = content.match(/^MONGODB_URI=(.*)$/m);
            if (match) {
                const uri = match[1].trim();
                console.log('Manually extracted MONGODB_URI (length):', uri.length);
                // Continue with manual URI
                await checkCluster(uri, 'Main Cluster (Manual)');
            }
        }
        return;
    }

    await checkCluster(MONGODB_URI, 'Main Cluster');
}

async function checkCluster(uri: string, label: string) {
    console.log(`\n=== Scanning Cluster: ${label} ===`);
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const dbs = await client.db().admin().listDatabases();
        console.log('Available DBs:', dbs.databases.map(d => d.name).join(', '));

        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;

            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();

            for (const col of collections) {
                const colName = col.name;
                if (colName.toLowerCase().includes('log')) {
                    const errors = await db.collection(colName)
                        .find({ level: 'ERROR' })
                        .sort({ timestamp: -1 })
                        .limit(3)
                        .toArray();

                    if (errors.length > 0) {
                        console.log(`    - ERRORS in ${dbName}.${colName}:`);
                        errors.forEach(e => {
                            console.log(`      [ERR] ${e.timestamp || e.createdAt} | ${e.source} | ${e.action}`);
                            console.log(`      Msg: ${e.message}`);
                            if (e.stack) console.log(`      Stack: ${e.stack.substring(0, 200)}...`);
                        });
                    }
                }

                if (colName === 'tenants') {
                    const abd = await db.collection(colName).findOne({ tenantId: 'abd_global' });
                    if (abd) {
                        console.log(`    - FOUND abd_global in ${dbName}.${colName}`);
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

run();
