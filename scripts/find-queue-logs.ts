
import { connectLogsDB } from '../src/lib/db';
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

process.env.MONGODB_URI = getEnv('MONGODB_URI');

async function findQueueLogs() {
    try {
        const db = await connectLogsDB();

        console.log('--- SEARCHING FOR QUEUE_SERVICE LOGS ---');
        const logs = await db.collection('application_logs')
            .find({
                source: 'QUEUE_SERVICE',
                timestamp: { $gt: new Date(Date.now() - 60 * 60 * 1000) } // Last Hour
            })
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();

        if (logs.length === 0) {
            console.log('❌ No QUEUE_SERVICE logs found in the last hour.');
        } else {
            console.log(`Found ${logs.length} logs:`);
            logs.forEach(l => {
                console.log(`\n[${l.timestamp.toISOString()}] Action: ${l.action} | Message: ${l.message}`);
                console.log(`Details:`, JSON.stringify(l.details, null, 2));
            });
        }

    } catch (e: any) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

findQueueLogs();
