
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

async function checkSpecificTenant() {
    try {
        const db = await connectAuthDB();

        console.log('--- TENANT CHECK (elevadores_mx) ---');
        const tenant = await db.collection('tenants').findOne({ tenantId: 'elevadores_mx' });

        if (tenant) {
            console.log('ID:', tenant._id);
            console.log('Name:', tenant.name);
            console.log('Branding:', JSON.stringify(tenant.branding || {}, null, 2));
            console.log('UpdatedAt:', tenant.updatedAt);
        } else {
            console.log('❌ Tenant "elevadores_mx" NOT FOUND in this DB.');
        }

        console.log('\n--- USERS CHECK (admin@elevadores.mx) ---');
        const user = await db.collection('users').findOne({ email: 'admin@elevadores.mx' });
        if (user) {
            console.log('User found:', user.email);
            console.log('Tenant:', user.tenantId);
        } else {
            console.log('❌ User "admin@elevadores.mx" NOT FOUND in this DB.');
        }

    } catch (e: any) {
        console.error('Error:', e);
    }
}

checkSpecificTenant();
