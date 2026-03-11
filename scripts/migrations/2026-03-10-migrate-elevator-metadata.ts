import { connectDB } from '../../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * 🚀 DOMAIN METADATA MIGRATION
 * Moves elevator-specific fields (componentType, model, version, revisionDate)
 * to a structured elevatorMetadata object for Knowledge Assets and Document Chunks.
 */
async function run() {
    const db = await connectDB();
    const assets = db.collection("knowledge_assets");
    const chunks = db.collection("document_chunks");

    console.log('🔄 Starting Domain Metadata Migration...');

    // 1. Migrate Knowledge Assets
    const assetCursor = assets.find({
        $or: [
            { componentType: { $exists: true } },
            { model: { $exists: true } },
            { elevatorMetadata: { $exists: false } }
        ]
    });

    let assetsProcessed = 0;
    let assetsMigrated = 0;

    while (await assetCursor.hasNext()) {
        const doc: any = await assetCursor.next();
        assetsProcessed++;

        const elevatorMetadata = {
            componentType: doc.componentType,
            model: doc.model,
            version: doc.version,
            revisionDate: doc.revisionDate
        };

        // Filter out undefined values
        Object.keys(elevatorMetadata).forEach(key =>
            (elevatorMetadata as any)[key] === undefined && delete (elevatorMetadata as any)[key]
        );

        if (Object.keys(elevatorMetadata).length > 0) {
            await assets.updateOne(
                { _id: doc._id },
                {
                    $set: { elevatorMetadata },
                    // We keep top-level deprecated fields for now to avoid breaking existing logic until full Era 13 audit
                }
            );
            assetsMigrated++;
        }
    }

    // 2. Migrate Document Chunks
    const chunkCursor = chunks.find({
        $or: [
            { componentType: { $exists: true } },
            { model: { $exists: true } },
            { elevatorMetadata: { $exists: false } }
        ]
    });

    let chunksProcessed = 0;
    let chunksMigrated = 0;

    while (await chunkCursor.hasNext()) {
        const doc: any = await chunkCursor.next();
        chunksProcessed++;

        const elevatorMetadata = {
            componentType: doc.componentType,
            model: doc.model,
            version: doc.version,
            revisionDate: doc.revisionDate
        };

        // Filter out undefined values
        Object.keys(elevatorMetadata).forEach(key =>
            (elevatorMetadata as any)[key] === undefined && delete (elevatorMetadata as any)[key]
        );

        if (Object.keys(elevatorMetadata).length > 0) {
            await chunks.updateOne(
                { _id: doc._id },
                {
                    $set: { elevatorMetadata }
                }
            );
            chunksMigrated++;
        }
    }

    console.log(`📊 Migration Summary:`);
    console.log(`📂 Knowledge Assets: ${assetsMigrated}/${assetsProcessed} migrated.`);
    console.log(`🧩 Document Chunks: ${chunksMigrated}/${chunksProcessed} migrated.`);
}

run().catch((e) => {
    console.error('💥 FATAL MIGRATION ERROR:', e);
    process.exit(1);
}).finally(() => {
    process.exit(0);
});
