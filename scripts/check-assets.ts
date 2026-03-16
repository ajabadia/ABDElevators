import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from '../src/lib/db';

async function checkAssets() {
    const db = await connectDB();
    const assets = await db.collection('knowledge_assets').find({
        isDeleted: { $ne: true }
    }).sort({ createdAt: -1 }).limit(5).toArray();
    
    console.log(`Latest Knowledge Assets:`);
    assets.forEach(a => {
        console.log(`[${a._id}] Status: ${a.status} - IngestStatus: ${a.ingestionStatus} - File: ${a.source?.filename || 'N/A'}`);
    });
    process.exit(0);
}

checkAssets().catch(console.error);
