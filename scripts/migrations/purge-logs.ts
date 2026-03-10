import path from 'node:path';
import { connectLogsDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function purgeLogs() {
    try {
        console.log('--- Purging APPLICATION_LOGS from LOGS DB ---');
        const logsDb = await connectLogsDB();

        const result = await logsDb.collection('application_logs').drop();
        console.log('✅ Collection application_logs dropped successfully:', result);

        await logsDb.client.close();
    } catch (error: any) {
        if (error.codeName === 'NamespaceNotFound') {
            console.log('⚠️ Collection application_logs does not exist or was already dropped.');
        } else {
            console.error('❌ Failed to purge logs:', error.message);
        }
    }
}

purgeLogs();
