
import { connectAuthDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkTenants() {
    try {
        const db = await connectAuthDB();
        const tenants = await db.collection('tenants').find({}).toArray();
        console.log(`Checking ${tenants.length} tenants...`);
        tenants.forEach(t => {
            console.log(`Tenant: ${t.tenantId} (${t.name})`);
            console.log(`  - storage.quota_bytes: ${t.storage?.quota_bytes}`);
            console.log(`  - storage.quotaBytes: ${t.storage?.quotaBytes}`);
        });
    } catch (error) {
        console.error('Error checking tenants:', error);
    }
    process.exit(0);
}

checkTenants().catch(err => {
    console.error(err);
    process.exit(1);
});
