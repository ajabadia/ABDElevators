
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkAppLogs() {
    const uri = process.env.MONGODB_LOGS_URI;
    if (!uri) {
        console.error('MONGODB_LOGS_URI not found');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Logs');
        
        console.log('--- Recent Application Logs (ERROR/WARN) ---');
        const logs = await db.collection('application_logs').find({
            level: { $in: ['ERROR', 'WARN'] }
        }).sort({ timestamp: -1 }).limit(10).toArray();

        console.log(JSON.stringify(logs, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.close();
    }
}

checkAppLogs();
