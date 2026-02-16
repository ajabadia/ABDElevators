
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function getRecentErrors() {
    const uri = process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();

        const dbName = process.env.MONGODB_LOGS_URI ? 'ABDElevators-Logs' : 'ABDElevators';
        const db = client.db(dbName);
        console.log(`Buscando errores recientes en DB: ${dbName}...`);

        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

        const logs = await db.collection('application_logs')
            .find({
                level: 'ERROR',
                timestamp: { $gte: twoHoursAgo }
            })
            .sort({ timestamp: -1 })
            .limit(100)
            .toArray();

        console.log(`Encontrados ${logs.length} errores recientes.`);
        fs.writeFileSync('recent_errors.json', JSON.stringify(logs, null, 2), 'utf-8');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

getRecentErrors();
