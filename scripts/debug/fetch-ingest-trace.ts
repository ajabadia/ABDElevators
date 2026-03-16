import * as dotenv from 'dotenv';
import path from 'path';
import { connectLogsDB } from '@abd/platform-core/server';

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function getIngestTrace() {
    console.log('🔍 Buscando trazas de ingesta recientes...');
    try {
        const logsDb = await connectLogsDB();
        const tenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const logs = await logsDb.collection('application_logs')
            .find({ 
                $or: [
                    { source: 'API_INGEST' },
                    { source: 'INGEST_SERVICE' },
                    { source: 'INGEST_INDEXER' },
                    { message: { $regex: /INGEST_TRACE/ } }
                ],
                timestamp: { $gte: tenMinutesAgo } 
            })
            .sort({ timestamp: 1 }) // Chronological order
            .toArray();

        if (logs.length === 0) {
            console.log('✅ No se encontraron trazas recientes.');
        } else {
            console.log(`📋 Se encontraron ${logs.length} trazas:`);
            logs.forEach((log, i) => {
                console.log(`[${log.timestamp.toISOString()}] [${log.source}] [${log.action || 'TRACE'}] ${log.message}`);
                if (log.details && Object.keys(log.details).length > 0) {
                    console.log(`   Details: ${JSON.stringify(log.details)}`);
                }
            });
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al consultar los logs:', error);
        process.exit(1);
    }
}

getIngestTrace();
