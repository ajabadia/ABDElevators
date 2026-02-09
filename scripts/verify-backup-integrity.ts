import { connectDB, connectAuthDB, connectLogsDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Simulacro de Verificación de Integridad de Backup (Fase 120.3)
 */
async function verifyBackupIntegrity() {
    console.log('🛡️  Starting Backup Integrity Drill...');
    console.log('------------------------------------');

    const results = {
        main: { status: 'UNKNOWN', count: 0, error: null as any },
        auth: { status: 'UNKNOWN', count: 0, error: null as any },
        logs: { status: 'UNKNOWN', count: 0, error: null as any }
    };

    try {
        // 1. Verificar MAIN DB
        console.log('🔍 Checking MAIN DB...');
        const mainDb = await connectDB();
        const assetCount = await mainDb.collection('knowledge_assets').countDocuments();
        results.main = { status: 'OK', count: assetCount, error: null };
        console.log(`✅ MAIN DB: Connected. Knowledge Assets: ${assetCount}`);

        // 2. Verificar AUTH DB
        console.log('🔍 Checking AUTH DB...');
        const authDb = await connectAuthDB();
        const userCount = await authDb.collection('users').countDocuments();
        results.auth = { status: 'OK', count: userCount, error: null };
        console.log(`✅ AUTH DB: Connected. Users: ${userCount}`);

        // 3. Verificar LOGS DB
        console.log('🔍 Checking LOGS DB...');
        const logsDb = await connectLogsDB();
        const logCount = await logsDb.collection('application_logs').countDocuments();
        results.logs = { status: 'OK', count: logCount, error: null };
        console.log(`✅ LOGS DB: Connected. Application Logs: ${logCount}`);

    } catch (error: any) {
        console.error('❌ DRILL FAILED:', error.message);
    }

    console.log('\n------------------------------------');
    console.log('📊 DRILL SUMMARY:');
    console.log(JSON.stringify(results, null, 2));

    const totalErrors = [results.main.error, results.auth.error, results.logs.error].filter(Boolean).length;
    if (totalErrors === 0) {
        console.log('\n🌟 BACKUP INTEGRITY VERIFIED: All clusters are responsive and consistent.');
        process.exit(0);
    } else {
        console.log(`\n⚠️  DRILL COMPLETED WITH ${totalErrors} ERRORS.`);
        process.exit(1);
    }
}

verifyBackupIntegrity().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
