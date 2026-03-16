
import { TenantService } from '../src/services/tenant/tenant-service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testConfig() {
    try {
        console.log('Testing getConfig for "abd_global"...');
        const config = await TenantService.getConfig('abd_global');
        console.log('Config retrieved:', JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error in getConfig:', error);
    }
    process.exit(0);
}

testConfig().catch(err => {
    console.error(err);
    process.exit(1);
});
