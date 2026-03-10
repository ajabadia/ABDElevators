import path from 'node:path';
import { connectLogsDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function auditLogsCollections() {
    try {
        console.log('--- Auditing LOGS DB Collections ---');
        const logsDb = await connectLogsDB();
        const collections = await logsDb.listCollections().toArray();
        console.log('Collections in LOGS DB:', collections.map(c => c.name));

        for (const col of collections) {
            const count = await logsDb.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);
        }

        await logsDb.client.close();
    } catch (error: any) {
        console.error('❌ Failed to audit logs collections:', error.message);
    }
}

auditLogsCollections();
