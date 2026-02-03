import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkDups() {
    const uri = process.env.MONGODB_URI;
    if (!uri) return;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const coll = db.collection('knowledge_assets');

        const dups = await coll.aggregate([
            {
                $group: {
                    _id: { tenantId: "$tenantId", environment: "$environment", fileMd5: "$fileMd5" },
                    count: { $sum: 1 }
                }
            },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();

        console.log(`REPORT_START`);
        console.log(`ASSETS_TOTAL: ${await coll.countDocuments()}`);
        console.log(`ASSETS_DUPS_GROUPS: ${dups.length}`);
        if (dups.length > 0) {
            console.log(`FIRST_DUP: ${JSON.stringify(dups[0])}`);
        }
        console.log(`REPORT_END`);

    } catch (e: any) {
        console.error('ERROR:', e.message);
    } finally {
        await client.close();
    }
}
checkDups();
