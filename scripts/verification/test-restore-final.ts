import dotenv from 'dotenv';
import path from 'path';
import { getKnowledgeAssetCollection } from '../src/lib/db-tenant';
import { ObjectId } from 'mongodb';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    try {
        console.log('--- STARTING RESTORATION TEST ---');
        const assetId = '67a8ea3f2bfcb-fa4ca0b6062d';
        const coll = await getKnowledgeAssetCollection({
            user: { tenantId: 'abd_global', role: 'SUPER_ADMIN' }
        });

        console.log('Attempting to update asset:', assetId);
        // We try both string and ObjectId just in case
        const result = await coll.updateOne(
            { _id: assetId as any },
            {
                $unset: { deletedAt: "" },
                $set: { status: 'vigente', ingestionStatus: 'PENDING' }
            },
            { includeDeleted: true }
        );

        console.log('Update result (String ID):', JSON.stringify(result, null, 2));

        if (result.matchedCount === 0) {
            console.log('Retrying with ObjectId...');
            const resultObj = await coll.updateOne(
                { _id: new ObjectId(assetId) },
                {
                    $unset: { deletedAt: "" },
                    $set: { status: 'vigente', ingestionStatus: 'PENDING' }
                },
                { includeDeleted: true }
            );
            console.log('Update result (ObjectId):', JSON.stringify(resultObj, null, 2));
        }

        const asset = await coll.findOne({ fileMd5: 'a9ffd0f06ca0011b16048a7e4857eda6' }, { includeDeleted: true });
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
