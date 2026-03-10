import path from 'node:path';
import { connectLogsDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fullLogsAudit() {
    try {
        console.log('--- FULL LOGS DB AUDIT ---');
        const logsDb = await connectLogsDB();
        const collections = await logsDb.listCollections().toArray();

        const auditResults = [];

        for (const colInfo of collections) {
            const colName = colInfo.name;
            const count = await logsDb.collection(colName).countDocuments();
            const samples = count > 0 ? await logsDb.collection(colName).find({}).limit(1).toArray() : [];

            auditResults.push({
                name: colName,
                count,
                sample: samples[0] || null
            });
        }

        console.log(JSON.stringify(auditResults, null, 2));
        await logsDb.client.close();
    } catch (error: any) {
        console.error('❌ Audit failed:', error.message);
    }
}

fullLogsAudit();
