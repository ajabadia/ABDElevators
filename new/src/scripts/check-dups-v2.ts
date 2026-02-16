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
        const colls = ['knowledge_assets', 'document_chunks', 'audit_ingestion'];

        for (const c of colls) {
            const coll = db.collection(c);
            const count = await coll.countDocuments();
            console.log(`Collection [${c}] has ${count} documents.`);

            if (c === 'knowledge_assets') {
                const dups = await coll.aggregate([
                    {
                        $group: {
                            _id: { tenantId: "$tenantId", environment: "$environment", fileMd5: "$fileMd5" },
                            count: { $sum: 1 }
                        }
                    },
                    { $match: { count: { $gt: 1 } } }
                ]).toArray();
                console.log(`Duplicates in [${c}]:`, dups.length);
                if (dups.length > 0) {
                    console.log('Sample duplication:', dups[0]);
                }
            }
        }

        const authDb = client.db('ABDElevators-Auth');
        const users = authDb.collection('users');
        const userCount = await users.countDocuments();
        console.log(`Collection [users] has ${userCount} documents.`);
        const userDups = await users.aggregate([
            { $group: { _id: "$email", count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();
        console.log(`Duplicates in [users]:`, userDups.length);

    } catch (e: any) {
        console.error('ERROR:', e.message);
    } finally {
        await client.close();
    }
}
checkDups();
