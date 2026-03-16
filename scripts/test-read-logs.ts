import { connectLogsDB } from './src/lib/db';

async function fetchLogs() {
    try {
        const db = await connectLogsDB();
        const logs = await db.collection('application_logs')
            .find({ level: 'ERROR' })
            .sort({ timestamp: -1 })
            .limit(5)
            .toArray();

        console.log("LAST 5 ERRORS:");
        logs.forEach(log => {
            console.log("-------------------");
            console.log(`Action: ${log.action}`);
            console.log(`Message: ${log.message}`);
            console.log(`Stack: ${log.stack}`);
        });
    } catch (e) {
        console.error("Failed to read logs", e);
    }
    process.exit(0);
}

fetchLogs();
