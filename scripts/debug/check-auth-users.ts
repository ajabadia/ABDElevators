import path from 'node:path';
import { connectAuthDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkAuthUsers() {
    try {
        console.log('--- Checking AUTH.users ---');
        const authDb = await connectAuthDB();
        const users = await authDb.collection('users').find({}).toArray();
        console.log(`Found ${users.length} users in AUTH.users:`);
        users.forEach(u => {
            console.log(`- ${u.email} (ID: ${u._id}, Role: ${u.role}, Tenant: ${u.tenantId})`);
        });
        await authDb.client.close();
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

checkAuthUsers();
