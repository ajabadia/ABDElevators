
import { connectDB } from '../lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function searchLogs() {
    console.log('📜 Searching logs for workflow activity...');

    try {
        const db = await connectDB();
        const logs = db.collection('logs_aplicacion');
        const entries = await logs.find({
            $or: [
                { source: 'WORKFLOW_SERVICE' },
                { accion: /UPSERT_DEFINITION/i },
                { mensaje: /repair/i }
            ]
        }).sort({ timestamp: -1 }).limit(20).toArray();

        console.log(`Found ${entries.length} recent entries:`);
        entries.forEach(e => {
            console.log(`[${e.timestamp}] ${e.source} | ${e.accion} | ${e.mensaje}`);
            console.log(`  Details: ${JSON.stringify(e.detalles)}`);
        });

    } catch (error) {
        console.error('❌ Error searching logs:', error);
    } finally {
        process.exit(0);
    }
}

searchLogs();
