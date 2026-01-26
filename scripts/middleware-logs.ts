
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkMiddlewareLogs() {
    const client = new MongoClient(process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Logs');
        const logs = await db.collection('logs_aplicacion')
            .find({ origen: 'SECURITY_MIDDLEWARE' })
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();

        console.log("LAST 10 MIDDLEWARE LOGS:");
        logs.forEach(l => {
            console.log(`[${l.timestamp?.toISOString()}] [${l.nivel}] [${l.accion}] ${l.mensaje}`);
            if (l.detalles) console.log("  Detalles:", JSON.stringify(l.detalles));
        });
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

checkMiddlewareLogs();
