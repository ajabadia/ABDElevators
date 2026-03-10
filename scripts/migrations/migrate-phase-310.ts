import path from 'node:path';
import { connectDB, connectConfigDB, connectLogsDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrateRemainingCollections() {
    try {
        const mainDb = await connectDB();
        const configDb = await connectConfigDB();
        const logsDb = await connectLogsDB();

        const toConfig = ['spaces', 'policies', 'taxonomies', 'agent_checkpoints'];
        const toLogs = ['audit_ingestion'];

        for (const colName of toConfig) {
            console.log(`🚀 Migrating '${colName}' to CONFIG...`);
            const source = mainDb.collection(colName);
            const target = configDb.collection(colName);
            const data = await source.find({}).toArray();
            if (data.length > 0) {
                await target.deleteMany({});
                await target.insertMany(data);
                console.log(`✅ Migrated ${data.length} docs to CONFIG.`);
            } else {
                console.log(`⚠️ No data for ${colName}.`);
            }
        }

        for (const colName of toLogs) {
            console.log(`🚀 Migrating '${colName}' to LOGS...`);
            const source = mainDb.collection(colName);
            const target = logsDb.collection(colName);
            const data = await source.find({}).toArray();
            if (data.length > 0) {
                await target.deleteMany({});
                await target.insertMany(data);
                console.log(`✅ Migrated ${data.length} docs to LOGS.`);
            } else {
                console.log(`⚠️ No data for ${colName}.`);
            }
        }

        await mainDb.client.close();
        await configDb.client.close();
        await logsDb.client.close();
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

migrateRemainingCollections();
