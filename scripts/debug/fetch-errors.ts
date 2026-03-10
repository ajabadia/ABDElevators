import { connectLogsDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

async function check() {
    const db = await connectLogsDB();
    const logs = await db.collection('application_logs')
        .find({ level: 'ERROR' })
        .sort({ timestamp: -1 })
        .limit(20)
        .toArray();

    let out = '';
    for (const log of logs) {
        out += `[${log.timestamp}] ${log.source} - ${log.action} - ${log.message}\n`;
        if (log.stack) out += `${log.stack}\n`;
        out += '\n-------------------\n';
    }
    fs.writeFileSync('scripts/debug/errors.txt', out, 'utf-8');
    console.log('Done!');
    process.exit(0);
}

check().catch(console.error);
