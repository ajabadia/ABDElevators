
import { connectDB } from '../src/lib/db';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
if (!process.env.MONGODB_URI) dotenv.config({ path: '.env' });

async function fix() {
    const db = await connectDB();
    console.log('--- SYNCING totalChunks ---');

    const assets = await db.collection('knowledge_assets').find({ 
        ingestionStatus: 'COMPLETED' 
    }).toArray();

    console.log(`Found ${assets.length} completed assets.`);

    for (const asset of assets) {
        const docId = asset._id;
        
        // Count chunks in document_chunks
        // We check for both ObjectId and String formats due to the recent discovery
        const chunkCount = await db.collection('document_chunks').countDocuments({
            $or: [
                { assetId: docId },
                { assetId: docId.toString() }
            ]
        });

        console.log(`Asset ${asset.filename} (${docId}): Actual chunks in DB = ${chunkCount}, Current metadata = ${asset.totalChunks}`);

        if (chunkCount > 0 && asset.totalChunks !== chunkCount) {
            await db.collection('knowledge_assets').updateOne(
                { _id: docId },
                { $set: { totalChunks: chunkCount, updatedAt: new Date() } }
            );
            console.log(`✅ Updated totalChunks to ${chunkCount}`);
        }
    }

    process.exit(0);
}

fix().catch(err => {
    console.error(err);
    process.exit(1);
});
