
import { connectAuthDB } from '../src/lib/db';
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

async function fixDefaultTenant() {
    try {
        const db = await connectAuthDB();
        const tenantId = 'default_tenant';

        console.log(`Checking ${tenantId}...`);
        const existing = await db.collection('tenants').findOne({ tenantId });

        const brownConfig = {
            name: "Default Tenant (Fixed)",
            branding: {
                colors: {
                    primary: "#964B00",
                    accent: "#964B00",
                    primaryDark: "#964B00",
                    accentDark: "#964B00"
                },
                autoDarkMode: true
            },
            status: 'ACTIVE',
            plan: 'ENTERPRISE',
            storage: { quota_bytes: 10737418240, used_bytes: 0, settings: { provider: 'local' } },
            updatedAt: new Date()
        };

        if (!existing) {
            console.log('Tenant not found. Creating...');
            await db.collection('tenants').insertOne({
                tenantId,
                ...brownConfig,
                createdAt: new Date()
            });
            console.log('✅ Created default_tenant with brown branding.');
        } else {
            console.log('Tenant found. Updating force...');
            await db.collection('tenants').updateOne(
                { tenantId },
                { $set: brownConfig }
            );
            console.log('✅ Updated default_tenant with brown branding.');
        }

    } catch (e: any) {
        console.error('Error:', e);
    }
}

fixDefaultTenant();
