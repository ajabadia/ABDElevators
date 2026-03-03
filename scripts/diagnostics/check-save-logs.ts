
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

async function checkAllAdminLogs() {
    try {
        const db = await connectLogsDB();

        console.log('--- CHECKING ALL RECENT ADMIN LOGS (Last 20 mins) ---');
        // Find logs where source contains "ADMIN" or "TENANT"
        const logs = await db.collection('application_logs')
            .find({
                source: { $regex: 'ADMIN|TENANT', $options: 'i' },
                timestamp: { $gt: new Date(Date.now() - 20 * 60 * 1000) }
            })
            .sort({ timestamp: -1 })
            .limit(20)
            .toArray();

        if (logs.length === 0) {
            console.log('❌ No ADMIN/TENANT logs found in the last 20 minutes.');
        } else {
            console.log(`Found ${logs.length} logs:`);
            logs.forEach(l => {
                console.log(`\n[${l.timestamp.toISOString()}] Level: ${l.level} | Source: ${l.source} | Action: ${l.action}`);
                console.log(`Message: ${l.message}`);
                if (l.details) {
                    console.log('Details:', JSON.stringify(l.details, null, 2).substring(0, 500) + '...');
                }
            });
        }

    } catch (e: any) {
        console.error('Error:', e);
    }
}

checkAllAdminLogs();
