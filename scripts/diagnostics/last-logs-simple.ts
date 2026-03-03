
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkRecentErrors() {
    const client = new MongoClient(process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Logs');
        const logs = await db.collection('logs_aplicacion')
            .find({})
            .sort({ timestamp: -1 })
            .limit(20)
            .toArray();

        console.log("LAST 20 LOGS:");
        logs.forEach(l => {
            console.log(`[${l.timestamp?.toISOString()}] [${l.nivel}] [${l.origen}] [${l.accion}] ${l.mensaje}`);
        });
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

checkRecentErrors();
