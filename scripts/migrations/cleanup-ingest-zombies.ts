import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function cleanupZombies() {
    console.log('🧹 Starting Ingestion Cleanup...');

    try {
        const db = await connectDB();

        // 1. Clean Knowledge Assets
        const assetsCol = db.collection('knowledge_assets');
        const assetsResult = await assetsCol.deleteMany({
            ingestionStatus: { $in: ['PENDING', 'FAILED'] }
        });
        console.log(`✅ Deleted ${assetsResult.deletedCount} zombie assets (PENDING/FAILED).`);

        // 2. Clean File Blobs (Physical files)
        const blobsCol = db.collection('file_blobs');
        // Since we are in debug/clean mode, and blobs were the source of the invisibility bug,
        // we clean all blobs that aren't referenced by a COMPLETED asset.

        // Get all MD5s of COMPLETED assets to keep them
        const completedAssets = await assetsCol.find({ ingestionStatus: 'COMPLETED' }).toArray();
        const validMd5s = completedAssets.map(a => a.fileMd5).filter(Boolean);

        const blobsResult = await blobsCol.deleteMany({
            _id: { $nin: validMd5s }
        });
        console.log(`✅ Deleted ${blobsResult.deletedCount} orphaned/invisible blobs.`);

        // 3. Clean Audits (Optional but good for "clean" slate)
        const auditCol = db.collection('audit_ingestion');
        const auditResult = await auditCol.deleteMany({});
        console.log(`✅ Cleaned ${auditResult.deletedCount} audit logs.`);

        console.log('✨ Database is now CLEAN for Ingestion.');
    } catch (e) {
        console.error('❌ Error during cleanup:', e);
    } finally {
        process.exit(0);
    }
}

cleanupZombies();
