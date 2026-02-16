
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

async function listTenantsAndUsers() {
    try {
        const db = await connectAuthDB();

        console.log('--- TENANTS ---');
        const tenants = await db.collection('tenants').find({}).project({ tenantId: 1, name: 1, 'branding.colors.primary': 1 }).toArray();
        tenants.forEach(t => console.log(`[${t.tenantId}] ${t.name} (Primary: ${t.branding?.colors?.primary})`));

        console.log('\n--- USERS (Filtered) ---');
        const users = await db.collection('users').find({
            email: { $regex: 'elevadores', $options: 'i' }
        }).toArray();
        users.forEach(u => console.log(`${u.email} -> ${u.tenantId}`));

    } catch (e: any) {
        console.error('Error:', e);
    }
}

listTenantsAndUsers();
