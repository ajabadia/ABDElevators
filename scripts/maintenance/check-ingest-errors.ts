
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkIngestErrors() {
    const uri = process.env.MONGODB_LOGS_URI;
    if (!uri) {
        console.error('MONGODB_LOGS_URI not found');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Logs');
        
        console.log('--- Recent Ingestion Errors ---');
        const logs = await db.collection('application_logs').find({
            action: { $in: ['INGEST_PROCESS_ERROR', 'INGEST_FAILED', 'INGEST_ERROR'] }
        }).sort({ timestamp: -1 }).limit(5).toArray();

        console.log(JSON.stringify(logs, null, 2));

        // Let's also search for any error with "Critical ingest error" in the message
        console.log('--- Searching for "Critical ingest error" ---');
        const criticalLogs = await db.collection('application_logs').find({
            message: /Critical ingest error/i
        }).sort({ timestamp: -1 }).limit(5).toArray();
        console.log(JSON.stringify(criticalLogs, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.close();
    }
}

checkIngestErrors();
