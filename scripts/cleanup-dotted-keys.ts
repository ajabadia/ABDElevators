import { MongoClient } from 'mongodb';

/**
 * Cleanup script — mark stale dotted translation keys as obsolete 
 * and clear translation cache.
 */
async function cleanup() {
    console.log('🧹 Cleaning up stale dotted translation keys...');

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not set');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('ABDElevators');
    const collection = db.collection('translations');

    // Find and mark obsolete all keys ending in ".desc" within common namespace
    const dotConflicts = await collection.find({
        key: { $regex: /\.desc$/ },
        namespace: 'common',
        isObsolete: { $ne: true }
    }).toArray();

    if (dotConflicts.length > 0) {
        console.log(`📋 Found ${dotConflicts.length} dot-conflict keys:`);
        for (const doc of dotConflicts) {
            console.log(`  - ${doc.key} (${doc.locale})`);
        }

        const bulkResult = await collection.updateMany(
            { key: { $regex: /\.desc$/ }, namespace: 'common', isObsolete: { $ne: true } },
            { $set: { isObsolete: true, lastUpdated: new Date(), updatedBy: 'CLEANUP_DOTTED_KEYS' } }
        );
        console.log(`  ✅ Marked ${bulkResult.modifiedCount} dot-conflict keys as obsolete`);
    } else {
        console.log('✅ No dot-conflict keys found in DB');
    }

    // Clear the translation cache
    try {
        const cacheResult = await db.collection('translation_cache').deleteMany({});
        console.log(`🗑️ Cleared ${cacheResult.deletedCount} cache entries`);
    } catch {
        console.log('ℹ️ No translation_cache collection found (using Redis or in-memory)');
    }

    await client.close();
    console.log('\n✨ Cleanup complete. Restart the dev server to see changes.');
    process.exit(0);
}

cleanup().catch(err => {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
});
