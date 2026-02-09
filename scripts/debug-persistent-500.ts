import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_LOGS_URI = process.env.MONGODB_LOGS_URI;
const MONGODB_AUTH_URI = process.env.MONGODB_AUTH_URI;

async function checkTenants() {
    console.log('--- Checking Auth DB Tenants ---');
    if (!MONGODB_AUTH_URI) {
        console.error('MONGODB_AUTH_URI is missing');
        return;
    }

    const client = new MongoClient(MONGODB_AUTH_URI);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Auth');
        const tenants = await db.collection('tenants').find({}).toArray();
        console.log(`Found ${tenants.length} tenants in Auth DB:`);
        tenants.forEach(t => console.group(`- ${t.tenantId} (${t.name})`, t.branding ? 'Has Branding' : 'No Branding'));
    } catch (e) {
        console.error('Error checking tenants:', e);
    } finally {
        await client.close();
    }
}

async function fetchLogs(uri: string | undefined, label: string) {
    console.log(`--- Fetching Logs from ${label} ---`);
    if (!uri) {
        console.error(`${label} URI is missing`);
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        // Try both 'application_logs' and 'logs' in the default database or 'ABDElevators'
        const dbNames = ['ABDElevators', 'ABDElevators-Logs'];
        for (const dbName of dbNames) {
            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();
            const logColName = collections.find(c => c.name.includes('log'))?.name;

            if (logColName) {
                console.log(`Found collection '${logColName}' in DB '${dbName}'`);
                const logs = await db.collection(logColName)
                    .find({ level: 'ERROR' })
                    .sort({ timestamp: -1 })
                    .limit(10)
                    .toArray();

                if (logs.length > 0) {
                    logs.forEach(l => {
                        console.log(`[${l.timestamp}] ${l.source} - ${l.action}: ${l.message}`);
                        if (l.stack) console.log(l.stack.substring(0, 500) + '...');
                        console.log('---');
                    });
                    return; // Stop if we found logs
                } else {
                    console.log(`No ERROR logs found in ${dbName}.${logColName}`);
                }
            }
        }
    } catch (e) {
        console.error(`Error fetching logs from ${label}:`, e);
    } finally {
        await client.close();
    }
}

async function run() {
    await checkTenants();
    await fetchLogs(MONGODB_URI, 'Main DB');
    await fetchLogs(MONGODB_LOGS_URI, 'Logs cluster');
}

run();
