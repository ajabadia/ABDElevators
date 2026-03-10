import path from 'node:path';
import { connectDB, connectConfigDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrateMoreConfigs() {
    try {
        const collections = ['prompt_versions', 'federated_patterns'];
        const mainDb = await connectDB();
        const configDb = await connectConfigDB();

        for (const colName of collections) {
            console.log(`🚀 Migrating '${colName}'...`);
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

        await mainDb.client.close();
        await configDb.client.close();
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

migrateMoreConfigs();
