
import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkAssetDetails(id: string) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        
        console.log(`--- Details for Asset ${id} ---`);
        const asset = await db.collection('knowledge_assets').findOne({ _id: new ObjectId(id) });
        console.log(JSON.stringify(asset, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.close();
    }
}

// Use the ID from the previous log or today's list
const assetId = process.argv[2];
if (assetId) {
    checkAssetDetails(assetId);
} else {
    console.log("Usage: npx tsx scripts/maintenance/check-asset-details.ts <id>");
}
