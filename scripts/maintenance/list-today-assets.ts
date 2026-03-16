
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listTodayAssets() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const assets = await db.collection('knowledge_assets').find({
            createdAt: { $gte: today }
        }).sort({ createdAt: -1 }).toArray();

        console.log(`--- Assets from today (${assets.length}) ---`);
        assets.forEach(a => {
            console.log(`ID: ${a._id}, Status: ${a.ingestionStatus}, Filename: ${a.source?.filename}, Tenant: ${a.tenantId}`);
        });

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.close();
    }
}

listTodayAssets();
