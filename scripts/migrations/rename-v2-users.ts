import path from 'node:path';
import { connectAuthDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function renameV2Users() {
    try {
        console.log('--- RENAMING LEGACY USERS (AUTH DB) ---');
        const authDb = await connectAuthDB();
        const timestamp = '20260309';

        const existing = (await authDb.listCollections().toArray()).map(c => c.name);

        if (existing.includes('v2_users')) {
            const newName = `v2_users_unused_${timestamp}`;
            console.log(`🏷️  Renaming 'v2_users' to '${newName}'...`);
            await authDb.collection('v2_users').rename(newName);
            console.log('✅ Renamed successfully.');
        } else {
            console.log('⚠️ v2_users collection not found.');
        }

        await authDb.client.close();
    } catch (error: any) {
        console.error('❌ Rename failed:', error.message);
    }
}

renameV2Users();
