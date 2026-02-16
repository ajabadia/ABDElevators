
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function countLogs() {
    const client = new MongoClient(process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Logs');
        const count = await db.collection('logs_aplicacion').countDocuments();
        console.log(`Total logs in ABDElevators-Logs.logs_aplicacion: ${count}`);

        const lastLog = await db.collection('logs_aplicacion').find().sort({ timestamp: -1 }).limit(1).toArray();
        console.log("Last log timestamp:", lastLog[0]?.timestamp);
        console.log("Last log message:", lastLog[0]?.mensaje);
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

countLogs();
