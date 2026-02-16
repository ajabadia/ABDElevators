import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../src/lib/db';
import { ObjectId } from 'mongodb';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    try {
        console.log('--- STARTING RAW RESTORATION ---');
        const db = await connectDB();
        const assetId = '67a8ea3f2bfcb78e3ceda267';

        console.log('Attempting raw update for asset:', assetId);

        // Try with ObjectId
        const result = await db.collection('knowledge_assets').updateOne(
            { _id: new ObjectId(assetId) },
            {
                $unset: { deletedAt: "" },
                $set: { status: 'vigente', ingestionStatus: 'PENDING' }
            }
        );

        console.log('Update result:', JSON.stringify(result, null, 2));

        const asset = await db.collection('knowledge_assets').findOne({ _id: new ObjectId(assetId) });
        console.log('Asset after update:', JSON.stringify(asset, null, 2));

        if (asset && !asset.deletedAt) {
            console.log('✅ SUCCESS: Asset restored.');
        } else {
            console.log('❌ FAILURE: Asset still has deletedAt or was not found.');
        }

    } catch (e: any) {
        console.error('Error:', e.message);
        console.error(e.stack);
    } finally {
        process.exit(0);
    }
}

run();
