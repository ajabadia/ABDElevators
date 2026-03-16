import { TenantConfigSchema } from '../src/lib/schemas/auth';
import { getTenantCollection } from '../src/lib/db-tenant';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testConfig() {
    try {
        console.log('Testing raw fetch for "abd_global"...');
        const systemSession = {
            user: {
                id: 'system',
                tenantId: 'abd_global',
                role: 'SUPER_ADMIN'
            }
        };

        const collection = await getTenantCollection<any>('tenants', systemSession as any, 'AUTH');
        const config = await collection.findOne({ tenantId: 'abd_global' });

        if (!config) {
            console.log('abd_global not found in DB');
        } else {
            console.log('Raw config from DB:', JSON.stringify(config, null, 2));

            const result = TenantConfigSchema.safeParse(config);
            if (!result.success) {
                console.log('Validation Failed:', JSON.stringify(result.error.issues, null, 2));
            } else {
                console.log('Validation Succeeded!');
                console.log('Normalized config:', JSON.stringify(result.data, null, 2));
            }
        }
    } catch (error) {
        console.error('Error in script:', error);
    }
    process.exit(0);
}

testConfig().catch(err => {
    console.error(err);
    process.exit(1);
});
