import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkAssets() {
    try {
        const db = await connectDB();
        const collection = db.collection('knowledge_assets');
        const assets = await collection.find({}).sort({ createdAt: -1 }).limit(5).toArray();

        console.log('--- RECENT ASSETS ---');
        console.log(JSON.stringify(assets, null, 2));
    } catch (e) {
        console.error('Error checking assets:', e);
    } finally {
        process.exit(0);
    }
}

checkAssets();
