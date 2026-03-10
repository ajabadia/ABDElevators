import path from 'node:path';
import { connectLogsDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function renameLogsCollections() {
    try {
        console.log('--- RENAMING LEGACY LOGS (LOGS DB) ---');
        const logsDb = await connectLogsDB();
        const timestamp = '20260309';

        const existing = (await logsDb.listCollections().toArray()).map(c => c.name);

        if (existing.includes('ai_configs----')) {
            const newName = `ai_configs_unused_${timestamp}`;
            console.log(`🏷️  Renaming 'ai_configs----' to '${newName}'...`);
            await logsDb.collection('ai_configs----').rename(newName);
            console.log('✅ Renamed successfully.');
        } else {
            console.log('⚠️ ai_configs---- collection not found.');
        }

        await logsDb.client.close();
    } catch (error: any) {
        console.error('❌ Rename failed:', error.message);
    }
}

renameLogsCollections();
