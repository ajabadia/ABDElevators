
import { TenantService } from '../src/lib/tenant-service';
import { connectAuthDB } from '../src/lib/db';
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

async function simulateSave() {
    try {
        console.log('--- SIMULATING SAVE VIA SERVICE ---');

        const tenantId = 'elevadores_mx';
        const newData = {
            name: "Elevadores MX (Agent Verified)",
            branding: {
                colors: {
                    primary: "#123456",
                    accent: "#654321"
                },
                companyName: "Elevadores MX Verified"
            }
        };

        console.log('Updating config for:', tenantId);

        // Mock session metadata
        const metadata = { performedBy: 'agent-script', correlationId: 'test-uuid' };

        const result = await TenantService.updateConfig(tenantId, newData, metadata);

        console.log('Update result:', JSON.stringify(result, null, 2));

        // Verify read back
        const db = await connectAuthDB();
        const verify = await db.collection('tenants').findOne({ tenantId });
        console.log('Read back name:', verify?.name);
        console.log('Read back primary color:', verify?.branding?.colors?.primary);

    } catch (e: any) {
        console.error('Error during simulation:', e);
        if (e.errors) {
            console.error('Validation Errors:', JSON.stringify(e.errors, null, 2));
        }
    }
}

simulateSave();
