
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkIngestLogs() {
    const client = new MongoClient(process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Logs');
        const logs = await db.collection('logs_aplicacion')
            .find({ source: 'API_INGEST' })
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();

        console.log("INGEST LOGS:");
        console.log(JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

checkIngestLogs();
