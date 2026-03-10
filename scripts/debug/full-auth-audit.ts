import path from 'node:path';
import { connectAuthDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fullAuthAudit() {
    try {
        console.log('--- FULL AUTH DB AUDIT ---');
        const authDb = await connectAuthDB();
        const collections = await authDb.listCollections().toArray();

        const auditResults = [];

        for (const colInfo of collections) {
            const colName = colInfo.name;
            const count = await authDb.collection(colName).countDocuments();
            const samples = count > 0 ? await authDb.collection(colName).find({}).limit(1).toArray() : [];

            auditResults.push({
                name: colName,
                count,
                sample: samples[0] || null
            });
        }

        console.log(JSON.stringify(auditResults, null, 2));
        await authDb.client.close();
    } catch (error: any) {
        console.error('❌ Audit failed:', error.message);
    }
}

fullAuthAudit();
