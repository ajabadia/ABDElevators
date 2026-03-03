
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key: string) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
};

const logsUri = getEnv('MONGODB_LOGS_URI') || getEnv('MONGODB_URI');

async function readLogs() {
    if (!logsUri) {
        console.error('Missing MONGODB_LOGS_URI');
        return;
    }

    const client = new MongoClient(logsUri);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Logs'); // Adjust if needed
        console.log('--- Ultimos Logs de TENANT_SERVICE ---');
        const logs = await db.collection('application_logs')
            .find({ source: 'TENANT_SERVICE' })
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();

        logs.forEach(log => {
            console.log(`[${log.timestamp.toISOString()}] [${log.action}] ${log.message}`);
            if (log.details) console.log('Details:', JSON.stringify(log.details, null, 2));
            console.log('---');
        });

    } catch (e: any) {
        console.error('Error reading logs:', e.message);
    } finally {
        await client.close();
    }
}

readLogs();
