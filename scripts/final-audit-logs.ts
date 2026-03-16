import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectLogsDB } from '../src/lib/db';

async function finalAuditCheck() {
    const db = await connectLogsDB();
    const logs = await db.collection('audit_ingestion').find({}).sort({ timestamp: -1 }).limit(10).toArray();
    
    console.log(`Latest Ingest Audit Events (LOGS Cluster):`);
    logs.forEach(l => {
        console.log(`[${l.timestamp}] ${l.action} - ${l.message} - CorrelationId: ${l.correlationId}`);
    });
    process.exit(0);
}

finalAuditCheck().catch(console.error);
