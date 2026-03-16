import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectLogsDB } from '../src/lib/db';

async function checkAppLogs() {
    const db = await connectLogsDB();
    const logs = await db.collection('application_logs').find({}).sort({ timestamp: -1 }).limit(20).toArray();
    
    console.log(`Latest Application Logs (LOGS Cluster):`);
    logs.forEach(l => {
        console.log(`[${l.timestamp}] ${l.level} - ${l.source} - ${l.action} - Msg: ${l.message}`);
    });
    process.exit(0);
}

checkAppLogs().catch(console.error);
