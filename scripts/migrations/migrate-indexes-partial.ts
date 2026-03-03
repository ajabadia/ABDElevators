import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrateIndexes() {
    try {
        const db = await connectDB();
        const collection = db.collection('knowledge_assets');

        console.log('Retrieving current indexes...');
        const indexes = await collection.indexes();

        const targetIndexes = [
            'fileMd5_1_tenantId_1_environment_1',
            'tenant_file_env_unique'
        ];

        for (const name of targetIndexes) {
            const exists = indexes.find(idx => idx.name === name);
            if (exists) {
                console.log(`Dropping index: ${name}...`);
                await collection.dropIndex(name);
            }
        }

        console.log('Creating Partial Unique Index: fileMd5_1_tenantId_1_environment_1...');
        await collection.createIndex(
            { fileMd5: 1, tenantId: 1, environment: 1 },
            {
                unique: true,
                name: 'fileMd5_1_tenantId_1_environment_1',
                partialFilterExpression: { deletedAt: { $exists: false } }
            }
        );

        console.log('Creating Partial Unique Index: tenant_file_env_unique...');
        await collection.createIndex(
            { tenantId: 1, filename: 1, environment: 1 },
            {
                unique: true,
                name: 'tenant_file_env_unique',
                partialFilterExpression: { deletedAt: { $exists: false } }
            }
        );

        console.log('✅ Migration completed successfully.');

    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        process.exit(0);
    }
}

migrateIndexes();
