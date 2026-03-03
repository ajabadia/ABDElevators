import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkLatestAsset() {
    try {
        const db = await connectDB();
        const collection = db.collection('knowledge_assets');
        const asset = await collection.find({}).sort({ createdAt: -1 }).limit(1).next();

        if (asset) {
            console.log('--- LATEST ASSET DETAILS ---');
            console.log('ID:', asset._id);
            console.log('Tenant ID:', asset.tenantId);
            console.log('Scope:', asset.scope);
            console.log('Filename:', asset.filename);
            console.log('Ingestion Status:', asset.ingestionStatus);
            console.log('MD5:', asset.fileMd5);
        } else {
            console.log('No assets found.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

checkLatestAsset();
