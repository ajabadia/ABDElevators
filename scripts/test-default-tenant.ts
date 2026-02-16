
import { TenantService } from '../src/lib/tenant-service';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key: string) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
};

process.env.MONGODB_AUTH_URI = getEnv('MONGODB_AUTH_URI');
process.env.MONGODB_URI = getEnv('MONGODB_URI');

async function checkDefaultTenant() {
    try {
        console.log('Testing TenantService.getConfig("default_tenant")...');
        const config = await TenantService.getConfig('default_tenant');

        console.log('--- RETURNED CONFIG (default_tenant) ---');
        console.log(JSON.stringify(config.branding, null, 2));

        if (config.branding?.colors?.primary === '#964B00') {
            console.log('✅ SUCCESS: Brown color returned for default_tenant.');
        } else {
            console.log('❌ FAILURE: Wrong color returned for default_tenant.');
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

checkDefaultTenant();
