import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB, connectLogsDB } from '../src/lib/db';

async function finalCheck() {
    const mainDb = await connectDB();
    const logsDb = await connectLogsDB();
    
    console.log('--- Checking Collections for Logs ---');
    const mainCols = await mainDb.listCollections().toArray();
    console.log('Main DB Collections:', mainCols.map(c => c.name).filter(n => n.includes('audit') || n.includes('log')));
    
    const logsCols = await logsDb.listCollections().toArray();
    console.log('Logs DB Collections:', logsCols.map(c => c.name).filter(n => n.includes('audit') || n.includes('log')));
    
    // Check counts
    if (mainCols.some(c => c.name === 'audit_ingestion')) {
        const count = await mainDb.collection('audit_ingestion').countDocuments();
        console.log(`audit_ingestion (Main) count: ${count}`);
    }
    
    if (logsCols.some(c => c.name === 'application_logs')) {
        const count = await logsDb.collection('application_logs').countDocuments();
        console.log(`application_logs (Logs) count: ${count}`);
    }

    process.exit(0);
}

finalCheck().catch(console.error);
