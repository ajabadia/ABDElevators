
import { connectDB } from '../src/lib/db';
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

async function checkAuditIngestion() {
    try {
        const db = await connectDB();

        console.log('--- CHECKING AUDIT_INGESTION (Last 15 mins) ---');
        const logs = await db.collection('audit_ingestion')
            .find({
                timestamp: { $gt: new Date(Date.now() - 15 * 60 * 1000) }
            })
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();

        if (logs.length === 0) {
            console.log('❌ No audit ingestion logs found.');
        } else {
            console.log(`Found ${logs.length} logs:`);
            logs.forEach(l => {
                console.log(`\n[${l.timestamp.toISOString()}] Status: ${l.status} | File: ${l.filename} | PerformedBy: ${l.performedBy}`);
                console.log(`Details:`, JSON.stringify(l.details, null, 2));
            });
        }

    } catch (e: any) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

checkAuditIngestion();
