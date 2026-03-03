import { connectDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function readLogs() {
    try {
        const db = await connectDB();
        const logs = await db.collection('logs').find({}).sort({ timestamp: -1 }).limit(50).toArray();

        console.log("📝 Recent Logs (Last 50):");
        logs.forEach(log => {
            console.log(`[${log.timestamp?.toISOString() || 'N/A'}] Source: ${log.source}, Action: ${log.action}, Message: ${log.message}`);
            if (log.details) console.log(`   Details: ${JSON.stringify(log.details)}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error reading logs:', error);
        process.exit(1);
    }
}

readLogs();
