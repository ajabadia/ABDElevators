import { connectAuthDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkUser() {
    try {
        const db = await connectAuthDB();
        const user = await db.collection('v2_users').findOne({ email: 'superadmin@abd.com' });
        if (user) {
            console.log('USER:', user.email);
            console.log('ROLE:', user.role);
            console.log('TENANT_ID:', user.tenantId);
        } else {
            // Check legacy users
            const legacyUser = await db.collection('users').findOne({ email: 'superadmin@abd.com' });
            if (legacyUser) {
                console.log('LEGACY USER:', legacyUser.email);
                console.log('ROLE:', legacyUser.role);
                console.log('TENANT_ID:', legacyUser.tenantId);
            } else {
                console.log('USER NOT FOUND');
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkUser();
