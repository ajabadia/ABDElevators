
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function cleanupBrokenIngestion() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        console.log('--- Database Cleanup: Broken Ingestion Records ---');

        // 1. Find broken blobs
        const brokenBlobs = await db.collection('file_blobs').find({
            $or: [
                { cloudinaryUrl: null },
                { cloudinaryUrl: { $exists: false } }
            ],
            storageProvider: 'cloudinary' // Only targeting Cloudinary ones as GridFS might be different
        }).toArray();

        console.log(`Step 1: Found ${brokenBlobs.length} broken file_blobs.`);
        if (brokenBlobs.length > 0) {
            const blobIds = brokenBlobs.map(b => b._id);
            const deleteResult = await db.collection('file_blobs').deleteMany({ _id: { $in: blobIds as any } });
            console.log(`   Deleted ${deleteResult.deletedCount} broken blobs.`);
        }

        // 2. Find broken knowledge assets
        const brokenAssets = await db.collection('knowledge_assets').find({
            $or: [
                { cloudinaryUrl: null },
                { cloudinaryUrl: { $exists: false } }
            ]
        }).toArray();

        console.log(`Step 2: Found ${brokenAssets.length} broken knowledge_assets.`);
        if (brokenAssets.length > 0) {
            // We MARK them as FAILED instead of deleting, so the user sees them and can retry
            const assetIds = brokenAssets.map(a => a._id);
            const updateResult = await db.collection('knowledge_assets').updateMany(
                { _id: { $in: assetIds } },
                {
                    $set: {
                        ingestionStatus: 'FAILED',
                        error: 'Broken upload record - please delete and re-upload.',
                        updatedAt: new Date()
                    }
                }
            );
            console.log(`   Updated ${updateResult.modifiedCount} broken assets to FAILED status.`);
        }

        console.log('--- Cleanup Complete ---');

    } catch (error) {
        console.error('CRITICAL CLEANUP ERROR:', error);
    } finally {
        await client.close();
    }
}

cleanupBrokenIngestion();
