import { connectDB, connectAuthDB, connectLogsDB, connectConfigDB } from '../../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testConnection() {
    try {
        console.log('Testing Main connection...');
        const db = await connectDB();
        console.log('Main connected to:', db.databaseName);

        console.log('Testing Auth connection...');
        const authDb = await connectAuthDB();
        console.log('Auth connected to:', authDb.databaseName);

        console.log('Testing Logs connection...');
        const logsDb = await connectLogsDB();
        console.log('Logs connected to:', logsDb.databaseName);

        console.log('Testing Config connection...');
        const configDb = await connectConfigDB();
        console.log('Config connected to:', configDb.databaseName);

    } catch (e) {
        console.error('Connection failed:', e);
    } finally {
        process.exit(0);
    }
}

testConnection();
