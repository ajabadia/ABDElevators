
import { connectLogsDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkLogs() {
    console.log('--- Verifying Search Logs in MongoDB ---');
    try {
        const db = await connectLogsDB();
        const logsCol = db.collection('application_logs');

        const hybridLogs = await logsCol.find({
            action: 'HYBRID_SEARCH_SUCCESS'
        }).sort({ timestamp: -1 }).limit(3).toArray();

        const keywordLogs = await logsCol.find({
            action: 'KEYWORD_SEARCH_SUCCESS'
        }).sort({ timestamp: -1 }).limit(3).toArray();

        console.log('\nRecent Hybrid Search Logs:');
        hybridLogs.forEach(log => {
            console.log(`- [${log.timestamp.toISOString()}] ${log.mensaje} | Duration: ${log.detalles?.duracion_ms}ms`);
        });

        console.log('\nRecent Keyword Search Logs:');
        keywordLogs.forEach(log => {
            console.log(`- [${log.timestamp.toISOString()}] ${log.mensaje} | Results: ${log.detalles?.resultados_count}`);
        });

        if (hybridLogs.length > 0 && keywordLogs.length > 0) {
            console.log('\n✅ HYBRID SEARCH IS FULLY OPERATIONAL');
        } else {
            console.warn('\n⚠️ Some search logs are missing. Check if search index is fully built.');
        }

    } catch (error: any) {
        console.error('❌ Error checking logs:', error.message);
    } finally {
        process.exit(0);
    }
}

checkLogs();
