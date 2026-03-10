import path from 'node:path';
import { connectAuthDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspectAdminUser() {
    try {
        console.log('--- Inspecting Admin User in AUTH.users ---');
        const authDb = await connectAuthDB();
        const user = await authDb.collection('users').findOne({ email: 'admin@abd.com' });

        if (user) {
            console.log(JSON.stringify(user, null, 2));
        } else {
            console.log('User not found!');
        }
        await authDb.client.close();
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

inspectAdminUser();
