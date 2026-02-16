
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspectDuplicates() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        console.log('--- Inspecting Duplicate Knowledge Assets ---');

        const assets = await db.collection('knowledge_assets').find({
            filename: { $regex: 'Real Decreto 203-2016' }
        }).sort({ createdAt: -1 }).toArray();

        console.log(`Found ${assets.length} assets matching the pattern.\n`);

        for (const asset of assets) {
            console.log(`ID: ${asset._id}`);
            console.log(`  Filename: ${asset.filename}`);
            console.log(`  MD5: ${asset.fileMd5 || 'MISSING'}`);
            console.log(`  Status: ${asset.ingestionStatus}`);
            console.log(`  URL: ${asset.cloudinaryUrl || 'NULL'}`);
            console.log(`  Public ID: ${asset.cloudinaryPublicId || 'NULL'}`);
            console.log(`  Error: ${asset.error || 'NONE'}`);
            console.log(`  Created: ${asset.createdAt.toISOString()}`);
            console.log(`  Tenant: ${asset.tenantId}`);
            console.log('-----------------------------------');

            if (asset.fileMd5) {
                const blob = await db.collection('file_blobs').findOne({ _id: asset.fileMd5 });
                if (blob) {
                    console.log(`  BLOB FOUND: ${blob._id}`);
                    console.log(`    Cloudinary URL: ${blob.cloudinaryUrl || 'NULL'}`);
                } else {
                    console.log(`  BLOB NOT FOUND for MD5: ${asset.fileMd5}`);
                }
                console.log('===================================');
            }
        }

    } catch (error) {
        console.error('INSPECTION ERROR:', error);
    } finally {
        await client.close();
    }
}

inspectDuplicates();
