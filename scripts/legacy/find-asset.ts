
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listAllAssets() {
    const client = new MongoClient(process.env.MONGODB_URI || '');
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const assets = await db.collection('knowledge_assets').find({}).limit(10).toArray();

        let output = '--- All Knowledge Assets ---\n';
        assets.forEach(asset => {
            output += `ID: ${asset._id}, Filename: ${asset.filename}, Tenant: ${asset.tenantId}, Cloudinary: ${asset.cloudinaryPublicId || asset.cloudinary_public_id}\n`;
        });
        fs.writeFileSync('assets_scan.txt', output);
        console.log('Results written to assets_scan.txt');
    } finally {
        await client.close();
    }
}

listAllAssets();
