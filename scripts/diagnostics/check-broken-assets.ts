
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkBrokenAssets() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        console.log('--- Checking for broken knowledge_assets ---');
        const brokenAssets = await db.collection('knowledge_assets').find({
            $or: [
                { cloudinaryUrl: null },
                { cloudinaryUrl: { $exists: false } }
            ]
        }).toArray();

        console.log(`Found ${brokenAssets.length} broken assets.`);
        for (const asset of brokenAssets) {
            console.log(`- ID: ${asset._id}, Filename: ${asset.filename}, MD5: ${asset.fileMd5}, Status: ${asset.ingestionStatus}`);

            // Check if there is a corresponding file_blob
            if (asset.fileMd5) {
                const blob = await db.collection('file_blobs').findOne({ _id: asset.fileMd5 as any });
                console.log(`  Corresponding file_blob: ${blob ? 'FOUND' : 'NOT FOUND'}`);
                if (blob) {
                    console.log(`  Blob cloudinaryUrl: ${blob.cloudinaryUrl}`);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkBrokenAssets();
