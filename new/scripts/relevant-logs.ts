
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkAllRecentLogs() {
    const client = new MongoClient(process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Logs');
        const logs = await db.collection('logs_aplicacion')
            .find({ source: { $in: ['API_INGEST', 'MIDDLEWARE', 'SECURITY_MIDDLEWARE', 'GEMINI_EMBEDDING', 'GEMINI_MINI'] } })
            .sort({ timestamp: -1 })
            .limit(50)
            .toArray();

        console.log("LAST 50 RELEVANT LOGS (RAW):");
        logs.forEach(l => {
            console.log(`[${l.timestamp}] [${l.nivel}] [${l.origen}] [${l.accion}] ${l.mensaje}`);
            if (l.detalles) console.log("  Detalles:", JSON.stringify(l.detalles));
        });
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

checkAllRecentLogs();
