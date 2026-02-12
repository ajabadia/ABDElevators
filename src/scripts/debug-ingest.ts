
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { connectDB, connectLogsDB } from './src/lib/db';
import { getTenantCollection } from './src/lib/db-tenant';

async function findTrace() {
    console.log('Connecting to DB...');
    await connectDB();

    // Use a technical session
    const session = { user: { role: 'SUPER_ADMIN', tenantId: 'platform_master' } };
    const auditColl = await getTenantCollection('audit_ingestion', session);

    console.log('Searching for logs related to "Real Decreto 203"...');
    const auditEntries = await auditColl.find({
        filename: { $regex: /203/i }
    }).sort({ createdAt: -1 }).toArray();

    if (auditEntries.length === 0) {
        console.log('No audit entries found.');
        process.exit(0);
    }

    console.log(`Found ${auditEntries.length} entries.`);
    for (const entry of auditEntries) {
        console.log(`- Date: ${entry.createdAt}, Status: ${entry.status}, CorrelationId: ${entry.correlationId}, DocId: ${entry.docId}`);
    }

    // Now get the detailed logs for the most recent correlationId
    const lastCorrelationId = auditEntries[0].correlationId;
    console.log(`\nFetching detail logs for correlationId: ${lastCorrelationId}`);

    const logsDb = await connectLogsDB();
    const appLogs = await logsDb.collection('application_logs').find({
        correlationId: lastCorrelationId
    }).sort({ timestamp: 1 }).toArray();

    console.log(`Found ${appLogs.length} detailed log entries:`);
    for (const log of appLogs) {
        console.log(`[${log.timestamp.toISOString()}] [${log.level}] [${log.source}] [${log.action}] ${log.message}`);
        if (log.stack) console.log(log.stack);
        if (log.details) console.log('Details:', JSON.stringify(log.details, null, 2));
    }

    process.exit(0);
}

findTrace().catch(err => {
    console.error(err);
    process.exit(1);
});
