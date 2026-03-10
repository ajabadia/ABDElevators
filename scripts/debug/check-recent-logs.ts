import path from 'node:path';
import { connectLogsDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkRecentLogs() {
    try {
        console.log('--- Checking Recent Logs (LOGS DB) ---');
        const logsDb = await connectLogsDB();
        const logs = await logsDb.collection('audit_trails')
            .find({ action: { $in: ['ROUTE_ACCESS', 'UNAUTHORIZED_ACCESS', 'PERMISSION_DENIED', 'JWT_CALLBACK_INIT', 'SESSION_CALLBACK_ERROR'] } })
            .sort({ timestamp: -1 })
            .limit(20)
            .toArray();

        console.log(`Found ${logs.length} relevant logs:`);
        logs.forEach(l => {
            console.log(`[${l.timestamp}] [${l.action}] ${l.message}`);
            if (l.details) console.log('  Details:', JSON.stringify(l.details));
        });

        // Also check application_logs if exist
        const appLogs = await logsDb.collection('application_logs')
            .find({})
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();
        console.log(`\nFound ${appLogs.length} app logs:`);
        appLogs.forEach(l => {
            console.log(`[${l.timestamp}] [${l.level}] ${l.message}`);
        });

        await logsDb.client.close();
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

checkRecentLogs();
