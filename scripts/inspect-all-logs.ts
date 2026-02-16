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

async function inspectAllLogs() {
    try {
        const db = await connectLogsDB();

        console.log('--- INSPECTING LAST 20 LOGS (GLOBAL) ---');
        const logs = await db.collection('application_logs')
            .find({})
            .sort({ timestamp: -1 })
            .limit(20)
            .toArray();

        if (logs.length === 0) {
            console.log('❌ No logs found.');
        } else {
            console.log(`Found ${logs.length} logs:`);
            logs.forEach(l => {
                const ts = l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp;
                console.log(`\n[${ts}] ${l.level} | ${l.source} | ${l.action}`);
                console.log(`Message: ${l.message}`);
                if (l.details) {
                    console.log('Details:', JSON.stringify(l.details, null, 2));
                }
                if (l.stack) {
                    console.log('Stack:', l.stack.substring(0, 500) + '...');
                }
            });
        }

    } catch (e: any) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

inspectAllLogs();
