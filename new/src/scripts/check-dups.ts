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
        const assets = db.collection('knowledge_assets');

        console.log('--- Checking knowledge_assets for duplicates ---');
        const dups = await assets.aggregate([
            {
                $group: {
                    _id: { tenantId: "$tenantId", environment: "$environment", fileMd5: "$fileMd5" },
                    count: { $sum: 1 },
                    ids: { $push: "$_id" }
                }
            },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();

        if (dups.length > 0) {
            console.log('DUPLICATES FOUND:', JSON.stringify(dups, null, 2));
        } else {
            console.log('No duplicates found in knowledge_assets.');
        }

        console.log('--- Checking users for duplicates ---');
        const authDb = client.db('ABDElevators-Auth');
        const users = authDb.collection('users');
        const userDups = await users.aggregate([
            { $group: { _id: "$email", count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();

        if (userDups.length > 0) {
            console.log('USER DUPLICATES FOUND:', JSON.stringify(userDups, null, 2));
        } else {
            console.log('No duplicates found in users.');
        }

    } catch (e: any) {
        console.error('ERROR:', e.message);
    } finally {
        await client.close();
    }
}
checkDups();
