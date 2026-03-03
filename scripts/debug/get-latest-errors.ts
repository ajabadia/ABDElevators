import * as dotenv from 'dotenv';
import path from 'path';
import { connectLogsDB } from '@abd/platform-core/server';

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function getErrors() {
    console.log('🔍 Buscando errores recientes en la base de datos...');
    try {
        const logsDb = await connectLogsDB();
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const errors = await logsDb.collection('application_logs')
            .find({ level: 'ERROR', timestamp: { $gte: tenMinutesAgo } })
            .sort({ timestamp: -1 })
            .limit(5)
            .toArray();

        if (errors.length === 0) {
            console.log('✅ No se encontraron errores recientes.');
        } else {
            console.log(`📋 Se encontraron ${errors.length} errores:`);
            errors.forEach((log, i) => {
                console.log(`\n--- ERROR #${i + 1} ---`);
                console.log(`📅 Timestamp: ${log.timestamp}`);
                console.log(`📌 Source: ${log.source}`);
                console.log(`🎬 Action: ${log.action}`);
                console.log(`💬 Message: ${log.message}`);
                console.log(`🔍 Details: ${JSON.stringify(log.details)}`);
                if (log.stack) console.log(`📚 Stack: ${log.stack.substring(0, 500)}...`);
            });
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al consultar los logs:', error);
        process.exit(1);
    }
}

getErrors();
