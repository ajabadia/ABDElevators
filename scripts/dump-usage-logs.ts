
import { connectLogsDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function dumpUsageLogs() {
    try {
        const db = await connectLogsDB();
        const logs = await db.collection('usage_logs').find({}).limit(5).toArray();
        console.log('Usage Logs Sample:', JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('Error dumping usage logs:', error);
    }
    process.exit(0);
}

dumpUsageLogs().catch(err => {
    console.error(err);
    process.exit(1);
});
