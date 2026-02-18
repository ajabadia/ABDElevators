import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../lib/db';
import { ObjectId } from 'mongodb';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fixAsset() {
    console.log('--- Fixing Asset Location ---');
    const db = await connectDB();
    const knowledge = db.collection('knowledge_assets');
    const docs = db.collection('docs_real_estate');

    const assetId = '698b48e7907e95bcba694d1a';

    // Find in docs_real_estate
    const asset = await docs.findOne({ _id: assetId });
    if (!asset) {
        console.log(`❌ Asset ${assetId} not found in docs_real_estate`);
        process.exit(1);
    }

    console.log(`✅ Found asset: ${asset.title}`);

    // Upsert into knowledge_assets
    const result = await knowledge.updateOne(
        { _id: assetId },
        { $set: { ...asset, updatedAt: new Date() } },
        { upsert: true }
    );

    if (result.upsertedCount > 0 || result.modifiedCount > 0) {
        console.log(`✅ Asset synced to knowledge_assets`);
    } else {
        console.log(`ℹ️ Asset already up to date in knowledge_assets`);
    }

    process.exit(0);
}

fixAsset().catch(console.error);
