
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkAllRecentLogs() {
    const client = new MongoClient(process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Logs');
        const logs = await db.collection('logs_aplicacion')
            .find({})
            .sort({ timestamp: -1 })
            .limit(5)
            .toArray();

        console.log("LAST 5 GLOBAL LOGS (RAW):");
        logs.forEach(l => {
            console.log(`[${l.timestamp}] [${l.nivel}] [${l.origen}] [${l.accion}] ${l.mensaje}`);
        });
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

checkAllRecentLogs();
