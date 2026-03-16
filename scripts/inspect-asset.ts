import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from '../src/lib/db';
import { ObjectId } from 'mongodb';

async function inspectAsset() {
    const db = await connectDB();
    const asset = await db.collection('knowledge_assets').findOne({
        _id: new ObjectId('69be41ac0df945ab850411ed')
    });
    
    console.log(`Asset Detail:`, JSON.stringify(asset, null, 2));
    process.exit(0);
}

inspectAsset().catch(console.error);
