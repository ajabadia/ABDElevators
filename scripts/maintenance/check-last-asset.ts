
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkLastAsset() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const asset = await db.collection('knowledge_assets').findOne({}, { sort: { createdAt: -1 } });
        
        console.log('--- Last Asset Info ---');
        console.log(JSON.stringify(asset, null, 2));

        if (asset) {
            const audit = await db.collection('audit_ingestion').find({ docId: asset._id.toString() }).toArray();
            console.log('--- Audit Logs ---');
            console.log(JSON.stringify(audit, null, 2));
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.close();
    }
}

checkLastAsset();
