import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkRecentLogs() {
    const uris = [
        { name: 'MAIN', uri: process.env.MONGODB_URI! },
        { name: 'LOGS', uri: process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI! }
    ];

    let out = '--- DB LOG CHECK ---\n';

    for (const item of uris) {
        const client = new MongoClient(item.uri);
        try {
            await client.connect();
            const dbs = ['ABDElevators', 'ABDElevators-Logs'];
            for (const dbName of dbs) {
                const db = client.db(dbName);
                const colNames = ['logs_aplicacion', 'logs_auditoria'];
                for (const colName of colNames) {
                    const count = await db.collection(colName).countDocuments();
                    if (count > 0) {
                        out += `DB: ${dbName} | COL: ${colName} | COUNT: ${count}\n`;
                        const latest = await db.collection(colName).find().sort({ timestamp: -1, fecha_creacion: -1 }).limit(3).toArray();
                        latest.forEach(l => {
                            out += `   [${l.timestamp || l.fecha_creacion}] [${l.origen}] ${l.mensaje}\n`;
                        });
                    }
                }
            }
        } catch (e: any) {
            out += `ERR ${item.name}: ${e.message}\n`;
        } finally {
            await client.close();
        }
    }
    fs.writeFileSync('ingest_logs.txt', out);
}
checkRecentLogs();
