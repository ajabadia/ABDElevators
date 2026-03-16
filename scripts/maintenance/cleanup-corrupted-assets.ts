import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from '../../src/lib/db';

/**
 * 🧹 Maintenance Script: Cleanup Corrupted Assets
 * Purpose: Remove assets with null/missing storage references or failed test ingestions.
 * Triggered by: User request to clean up "test records" and "problematic records".
 */
async function cleanup() {
    console.log('🚀 Starting Knowledge Assets Cleanup...');
    
    let db;
    try {
        db = await connectDB();
    } catch (e) {
        console.error('❌ Failed to connect to DB. Ensure MONGODB_URI is set.');
        process.exit(1);
    }
    
    const collection = db.collection('knowledge_assets');

    // 1. Target: Assets with null/missing downloadUrl (Corrupted)
    const corruptedQuery = {
        $or: [
            { 'source.downloadUrl': null },
            { 'source.downloadUrl': { $exists: false } },
            { source: { $exists: false } }
        ]
    };

    // 2. Target: Failed ingestions (Often test records that didn't work)
    const failedQuery = {
        ingestionStatus: 'FAILED'
    };

    // 3. Target: Assets in STAGING/DEVELOPMENT (If specified, but let's be safe and only do corrupted/failed for now unless asked for more)
    
    const countCorrupted = await collection.countDocuments(corruptedQuery);
    const countFailed = await collection.countDocuments(failedQuery);

    console.log(`🔍 Stats:`);
    console.log(`   - Corrupted/Legacy (null URL): ${countCorrupted}`);
    console.log(`   - Failed Ingestions: ${countFailed}`);

    if (countCorrupted > 0) {
        const res = await collection.deleteMany(corruptedQuery);
        console.log(`✅ Deleted ${res.deletedCount} corrupted assets.`);
    }

    if (countFailed > 0) {
        const res = await collection.deleteMany(failedQuery);
        console.log(`✅ Deleted ${res.deletedCount} failed assets.`);
    }

    console.log('✨ Cleanup finished.');
    process.exit(0);
}

cleanup().catch(err => {
    console.error('❌ Fatal error during cleanup:', err);
    process.exit(1);
});
