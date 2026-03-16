
import { connectAuthDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function dumpTenant() {
    try {
        const db = await connectAuthDB();
        const tenant = await db.collection('tenants').findOne({ tenantId: 'abd_global' });
        console.log('Tenant "abd_global" data:', JSON.stringify(tenant, null, 2));
    } catch (error) {
        console.error('Error dumping tenant:', error);
    }
    process.exit(0);
}

dumpTenant().catch(err => {
    console.error(err);
    process.exit(1);
});
