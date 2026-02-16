
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Load env.local manually
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key: string) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
};

const MONGODB_URI = getEnv('MONGODB_URI');

if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
}

async function checkRecentErrorsRaw() {
    let client;
    try {
        console.log('Connecting to MongoDB Logs (Raw Client)...');
        client = new MongoClient(process.env.MONGODB_URI || '');
        await client.connect();

        const db = client.db('test'); // Assuming default db name or check connection string
        // Actually, we need to know the DB name. Usually it's in the URI or default.
        // Let's list collections to be sure where 'application_logs' is.

        const adminDb = client.db().admin();
        const dbs = await adminDb.listDatabases();
        // console.log('Databases:', dbs.databases.map(d => d.name));

        const targetDbName = 'test'; // Default for Atlas unless specified
        const logsCollection = client.db(targetDbName).collection('application_logs');

        console.log('--- CHECKING RECENT ERROR LOGS (Last 60 mins) ---');
        const logs = await logsCollection
            .find({
                level: { $in: ['ERROR', 'WARN', 'CRITICAL'] },
                timestamp: { $gt: new Date(Date.now() - 60 * 60 * 1000) }
            })
            .sort({ timestamp: -1 })
            .limit(20)
            .toArray();

        if (logs.length === 0) {
            console.log('❌ No ERROR/WARN logs found in the last 60 minutes.');
        } else {
            console.log(`Found ${logs.length} logs:`);
            logs.forEach((l: any) => {
                console.log(`\n[${l.timestamp.toISOString()}] Level: ${l.level} | Source: ${l.source} | Action: ${l.action}`);
                console.log(`Message: ${l.message}`);
                console.log(`Details: ${JSON.stringify(l.details || {}, null, 2).substring(0, 200)}...`);
                if (l.stack) console.log(`Stack: ${l.stack.substring(0, 200)}...`);
            });
        }

    } catch (e: any) {
        console.error('Error:', e);
    } finally {
        if (client) await client.close();
    }
}

checkRecentErrorsRaw();
