
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkIngestLogs() {
    const client = new MongoClient(process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Logs');
        const log = await db.collection('logs_aplicacion')
            .findOne({ source: 'API_INGEST', level: 'ERROR' }, { sort: { timestamp: -1 } });

        if (log) {
            console.log("LAST INGEST ERROR:");
            console.log("Timestamp:", log.timestamp);
            console.log("Mensaje:", log.mensaje);
            console.log("Accion:", log.accion);
            if (log.detalles) console.log("Detalles:", JSON.stringify(log.detalles, null, 2));
            if (log.stack) console.log("Stack:", log.stack);
        } else {
            console.log("No ingest error logs found.");
        }
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

checkIngestLogs();
