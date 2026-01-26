import { connectAuthDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugDb() {
    console.log('🔍 Debugging Auth Database...');
    try {
        const db = await connectAuthDB();
        console.log('✅ Connected to Auth DB:', db.databaseName);

        const users = await db.collection('users').find({}).toArray();
        console.log(`👤 Found ${users.length} users in 'users' collection:`);
        users.forEach(u => {
            console.log(` - Email: ${u.email}, MFA Enabled: ${u.mfaEnabled || false}, ID: ${u._id}`);
        });

        const configs = await db.collection('mfa_configs').find({}).toArray();
        console.log(`🛡️ Found ${configs.length} MFA configs:`);
        configs.forEach(c => {
            console.log(` - UserID: ${c.userId}, Enabled: ${c.enabled}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

debugDb();
