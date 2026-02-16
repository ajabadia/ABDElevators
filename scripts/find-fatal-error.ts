import { connectLogsDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function findFatalError() {
    try {
        const db = await connectLogsDB();
        const logs = await db.collection('application_logs')
            .find({ level: 'ERROR' })
            .sort({ timestamp: -1 })
            .limit(5)
            .toArray();

        console.log(`--- FOUND ${logs.length} ERRORS ---`);
        logs.forEach((log, i) => {
            console.log(`\nERROR #${i + 1}`);
            console.log(`TIME:    ${log.timestamp}`);
            console.log(`SOURCE:  ${log.source}`);
            console.log(`ACTION:  ${log.action}`);
            console.log(`MESSAGE: ${log.message}`);
            console.log(`DETAILS: ${JSON.stringify(log.details || {})}`);
            if (log.stack) console.log(`STACK:   ${log.stack.substring(0, 500)}...`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

findFatalError();
