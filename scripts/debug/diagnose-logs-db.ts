import path from 'node:path';
import { connectLogsDB, connectDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnose() {
    try {
        console.log('--- Diagnosing LOGS DB ---');
        const logsUri = process.env.MONGODB_LOGS_URI;
        console.log('LOGS URI:', logsUri ? logsUri.replace(/:([^@]+)@/, ':****@') : 'UNDEFINED');

        const logsDb = await connectLogsDB();
        console.log('✅ Connected to LOGS DB:', logsDb.databaseName);

        const admin = logsDb.client.db('admin');
        const dbs = await admin.admin().listDatabases();
        console.log('Databases available:', dbs.databases.map((db: any) => `${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`));

        await logsDb.client.close();
    } catch (error: any) {
        console.error('❌ Failed to connect to LOGS DB:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

diagnose();
