
import { connectLogsDB } from '../lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function searchLogs() {
    console.log('📜 Searching logs for workflow activity...');

    try {
        const db = await connectLogsDB();
        const logs = db.collection('application_logs');
        const entries = await logs.find({
            $or: [
                { source: 'WORKFLOW_SERVICE' },
                { action: /UPSERT_DEFINITION/i },
                { message: /repair/i }
            ]
        }).sort({ timestamp: -1 }).limit(20).toArray();

        console.log(`Found ${entries.length} recent entries:`);
        entries.forEach(e => {
            console.log(`[${e.timestamp}] ${e.source} | ${e.action} | ${e.message}`);
            console.log(`  Details: ${JSON.stringify(e.details)}`);
        });

    } catch (error) {
        console.error('❌ Error searching logs:', error);
    } finally {
        process.exit(0);
    }
}

searchLogs();
