import path from 'node:path';
import { connectDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fullMainAudit() {
    try {
        console.log('--- FULL MAIN DB AUDIT ---');
        const mainDb = await connectDB();
        const collections = await mainDb.listCollections().toArray();

        const auditResults = [];

        for (const colInfo of collections) {
            const colName = colInfo.name;
            const count = await mainDb.collection(colName).countDocuments();
            const samples = count > 0 ? await mainDb.collection(colName).find({}).limit(1).toArray() : [];

            auditResults.push({
                name: colName,
                count,
                sample: samples[0] || null
            });
        }

        console.log(JSON.stringify(auditResults, null, 2));
        await mainDb.client.close();
    } catch (error: any) {
        console.error('❌ Audit failed:', error.message);
    }
}

fullMainAudit();
