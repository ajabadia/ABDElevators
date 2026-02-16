import { connectDB, connectLogsDB } from '../src/lib/db';
import { getTenantCollection } from '../src/lib/db-tenant';
import { FileBlobSchema } from '../src/lib/schemas';
import crypto from 'crypto';

async function migrateBlobs() {
    console.log('🚀 Starting FileBlob Migration (Phase 125.1)...');

    // Connect to DBs
    await connectDB();
    await connectLogsDB();

    // Use a superadmin session context to access global file_blobs
    const session = {
        user: {
            id: 'system_migration',
            email: 'migration@abd.com',
            tenantId: 'platform_master',
            role: 'SUPER_ADMIN'
        }
    };

    const assetsCollection = await getTenantCollection('knowledge_assets', session);
    const fileBlobsCollection = await getTenantCollection('file_blobs', session);

    // Get all assets that have MD5 and are successfully ingested
    const assets = await assetsCollection.find({
        fileMd5: { $exists: true, $ne: 'unknown' },
        ingestionStatus: 'COMPLETED'
    });

    console.log(`📦 Found ${assets.length} assets to process.`);

    let created = 0;
    let reused = 0;
    let skipped = 0;

    for (const asset of assets) {
        const md5 = asset.fileMd5;

        if (!md5 || !asset.cloudinaryUrl || !asset.cloudinaryPublicId) {
            console.warn(`⚠️ Asset ${asset._id} missing critical data. Skipping.`);
            skipped++;
            continue;
        }

        // Check availability in blobs
        const existingBlob = await fileBlobsCollection.findOne({ _id: md5 });

        if (existingBlob) {
            // Already exists, increment refCount
            await fileBlobsCollection.updateOne(
                { _id: md5 },
                {
                    $inc: { refCount: 1 },
                    $set: { lastSeenAt: new Date() }
                }
            );
            reused++;
        } else {
            // Create new Blob
            try {
                const blobData = {
                    _id: md5,
                    cloudinaryUrl: asset.cloudinaryUrl,
                    cloudinaryPublicId: asset.cloudinaryPublicId,
                    mimeType: 'application/pdf', // Default assumption for migration
                    sizeBytes: asset.sizeBytes || 0,
                    refCount: 1,
                    firstSeenAt: asset.createdAt || new Date(),
                    lastSeenAt: new Date(),
                    storageProvider: 'cloudinary',
                    metadata: { sourceAssetId: asset._id, migratedAt: new Date() }
                };

                await fileBlobsCollection.insertOne(FileBlobSchema.parse(blobData));
                created++;
            } catch (e: any) {
                console.error(`❌ Error creating blob for ${md5}:`, e.message);
                skipped++;
            }
        }
    }

    console.log(`✅ Migration Complete.`);
    console.log(`- Created Blobs: ${created}`);
    console.log(`- Reused/Linked: ${reused}`);
    console.log(`- Skipped/Error: ${skipped}`);

    process.exit(0);
}

migrateBlobs().catch(console.error);
