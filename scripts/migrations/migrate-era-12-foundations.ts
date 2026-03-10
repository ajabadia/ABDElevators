import { connectDB, connectAuthDB, connectLogsDB, connectConfigDB } from '../../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrateFoundations() {
    try {
        console.log('🚀 ERA 12 FOUNDATIONAL MIGRATION');

        // 1. AUTH CLUSTER
        const authDb = await connectAuthDB();
        console.log('Configuring AUTH...');
        // Initialize isDeleted field for users
        await authDb.collection('v2_users').updateMany(
            { isDeleted: { $exists: false } },
            { $set: { isDeleted: false } }
        );
        try {
            await authDb.collection('v2_users').createIndex(
                { tenantId: 1, email: 1 },
                { unique: true, name: 'tenant_email_unique', partialFilterExpression: { isDeleted: false } }
            );
            console.log('✅ v2_users index OK');
        } catch (e: any) { console.warn(`⚠️ v2_users index: ${e.message}`); }

        // 2. LOGS CLUSTER
        const logsDb = await connectLogsDB();
        console.log('Configuring LOGS...');
        try {
            await logsDb.collection('user_sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'session_ttl' });
            await logsDb.collection('application_logs').createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000, name: 'logs_ttl' });
            console.log('✅ LOGS TTLs OK');
        } catch (e: any) { console.warn(`⚠️ LOGS TTLs: ${e.message}`); }

        // 3. CONFIG CLUSTER
        const configDb = await connectConfigDB();
        console.log('Configuring CONFIG...');
        await configDb.collection('spaces').updateMany(
            { isDeleted: { $exists: false } },
            { $set: { isDeleted: false } }
        );
        try {
            await configDb.collection('spaces').createIndex(
                { tenantId: 1, slug: 1 },
                { unique: true, name: 'tenant_slug_unique', partialFilterExpression: { isDeleted: false } }
            );
            console.log('✅ Spaces index OK');
        } catch (e: any) { console.warn(`⚠️ Spaces index: ${e.message}`); }

        // 4. MAIN CLUSTER
        const mainDb = await connectDB();
        console.log('Configuring MAIN...');
        try {
            await mainDb.collection('asset_chunks').createIndex({ assetId: 1, vectorId: 1 }, { unique: true, name: 'asset_vector_unique' });
            console.log('✅ Asset Chunks index OK');
        } catch (e: any) { console.warn(`⚠️ Asset Chunks index: ${e.message}`); }

        console.log('🚀 ERA 12 MIGRATION COMPLETE');
    } catch (e: any) {
        console.error('❌ GLOBAL MIGRATION ERROR:', e.message);
    } finally {
        process.exit(0);
    }
}

migrateFoundations();
