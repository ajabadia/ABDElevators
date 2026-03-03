
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

process.env.MONGODB_AUTH_URI = getEnv('MONGODB_AUTH_URI');
process.env.MONGODB_URI = getEnv('MONGODB_URI');

async function checkRecentErrors() {
    try {
        const db = await connectLogsDB();

        console.log('--- CHECKING RECENT ERROR LOGS (Last 30 mins) ---');
        // Find logs where level is ERROR or WARN
        const logs = await db.collection('application_logs')
            .find({
                level: { $in: ['ERROR', 'WARN', 'CRITICAL'] },
                timestamp: { $gt: new Date(Date.now() - 30 * 60 * 1000) }
            })
            .sort({ timestamp: -1 })
            .limit(20)
            .toArray();

        if (logs.length === 0) {
            console.log('❌ No ERROR/WARN logs found in the last 30 minutes.');
        } else {
            console.log(`Found ${logs.length} logs:`);
            logs.forEach(l => {
                console.log(`\n[${l.timestamp.toISOString()}] Level: ${l.level} | Source: ${l.source} | Action: ${l.action}`);
                console.log(`Message: ${l.message}`);
                console.log(`Details: ${JSON.stringify(l.details || {}, null, 2).substring(0, 200)}...`);
                if (l.stack) console.log(`Stack: ${l.stack.substring(0, 200)}...`);
            });
        }

    } catch (e: any) {
        console.error('Error:', e);
    }
}

checkRecentErrors();
