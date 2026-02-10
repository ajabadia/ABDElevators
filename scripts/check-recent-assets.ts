import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkRecentAssets() {
    try {
        const db = await connectDB();
        const collection = db.collection('knowledge_assets');
        const now = new Date();
        const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);

        const assets = await collection.find({
            createdAt: { $gt: fifteenMinsAgo }
        }).sort({ createdAt: -1 }).toArray();

        console.log(`--- ASSETS CREATED IN LAST 15 MINS (${assets.length}) ---`);
        console.log(JSON.stringify(assets, null, 2));
    } catch (e) {
        console.error('Error checking recent assets:', e);
    } finally {
        process.exit(0);
    }
}

checkRecentAssets();
