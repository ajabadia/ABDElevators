import { connectLogsDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function dumpFatalError() {
    try {
        const db = await connectLogsDB();
        const logs = await db.collection('application_logs')
            .find({ level: 'ERROR' })
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();

        let output = `--- FOUND ${logs.length} ERRORS ---\n`;
        logs.forEach((log, i) => {
            output += `\nERROR #${i + 1}\n`;
            output += `TIME:    ${log.timestamp}\n`;
            output += `SOURCE:  ${log.source}\n`;
            output += `ACTION:  ${log.action}\n`;
            output += `MESSAGE: ${log.message}\n`;
            output += `DETAILS: ${JSON.stringify(log.details || {})}\n`;
            if (log.stack) output += `STACK:   ${log.stack}\n`;
            output += `-----------------------------------\n`;
        });

        fs.writeFileSync(path.join(process.cwd(), 'scripts/error-dump.txt'), output);
        console.log('LOGS DUMPED TO scripts/error-dump.txt');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

dumpFatalError();
