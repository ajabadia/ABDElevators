
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function printLogs() {
    const client = new MongoClient(process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Logs');
        const logs = await db.collection('logs_aplicacion')
            .find({})
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();

        console.log("TIME | LEVEL | ORIGIN | ACTION | MESSAGE");
        logs.forEach(l => {
            const time = l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : 'N/A';
            console.log(`${time} | ${l.nivel} | ${l.origen} | ${l.accion} | ${l.mensaje.substring(0, 50)}`);
        });
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

printLogs();
