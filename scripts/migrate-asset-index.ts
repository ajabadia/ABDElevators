import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrateIndex() {
    console.log('🚀 Starting Index Migration: knowledge_assets...');

    try {
        const db = await connectDB();
        const collection = db.collection('knowledge_assets');

        console.log('1. Checking for existing duplicates that might block partial index...');
        // We don't expect many because it was "unique" before, but maybe we had soft-deleted ones.
        // Actually, if it was unique before, we couldn't have duplicates anyway.
        // So dropping and recreating with partial filter is safe.

        console.log('2. Dropping old index: idx_unique_asset_md5_per_tenant');
        try {
            await collection.dropIndex('idx_unique_asset_md5_per_tenant');
            console.log('✅ Index dropped.');
        } catch (e) {
            console.log('⚠️ Index not found or already dropped.');
        }

        console.log('3. Creating new Partial Unique Index...');
        await collection.createIndex(
            { tenantId: 1, environment: 1, fileMd5: 1 },
            {
                unique: true,
                name: 'idx_unique_asset_md5_per_tenant',
                partialFilterExpression: { deletedAt: { $exists: false } }
            }
        );
        console.log('✅ Partial unique index created successfully.');

        console.log('✨ Index migration COMPLETED.');
    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        process.exit(0);
    }
}

migrateIndex();
