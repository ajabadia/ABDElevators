import { connectLogsDB } from '../lib/db';
import dotenv from 'dotenv';
dotenv.config();

async function diagnostic() {
    console.log('--- DIAGNÓSTICO AUDIT LOGS ---');
    try {
        const db = await connectLogsDB();
        const coll = db.collection('application_logs');

        const totalRaw = await coll.countDocuments({});
        console.log(`Total logs (Raw): ${totalRaw}`);

        const sample = await coll.find({}).limit(1).toArray();
        console.log('Sample Log Structure:', JSON.stringify(sample[0], null, 2));

        const levels = await coll.distinct('level');
        console.log('Unique Levels:', levels);

        console.log('Running aggregation facet...');
        const [stats] = await coll.aggregate([
            {
                $facet: {
                    levels: [
                        { $group: { _id: "$level", count: { $sum: 1 } } }
                    ],
                    sources: [
                        { $group: { _id: "$source", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    total: [
                        { $count: "count" }
                    ]
                }
            }
        ]).toArray();

        console.log('Aggregation result (Facet):', JSON.stringify(stats, null, 2));

        process.exit(0);
    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    }
}

diagnostic();
