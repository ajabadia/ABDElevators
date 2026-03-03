
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function checkLogs() {
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const logs = await db.collection('logs_aplicacion')
            .find({ timestamp: { $gte: fifteenMinutesAgo } })
            .sort({ timestamp: -1 })
            .limit(20)
            .toArray();

        console.log(JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

checkLogs();
