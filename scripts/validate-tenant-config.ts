
import { MongoClient } from 'mongodb';
import { TenantConfigSchema } from '../src/lib/schemas';
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

const uri = getEnv('MONGODB_AUTH_URI') || getEnv('MONGODB_URI');

async function validateTenant() {
    if (!uri) {
        console.error('Missing MONGODB_URI');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Auth');
        const tenants = await db.collection('tenants').find({}).toArray();

        console.log(`Found ${tenants.length} tenants`);
        for (const config of tenants) {
            console.log(`\n--- Tenant: ${config.tenantId} ---`);
            console.log('NAME:', config.name);
            console.log('BRANDING:', JSON.stringify(config.branding, null, 2));
            console.log('UPDATED_AT:', config.updatedAt);
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        await client.close();
    }
}

validateTenant();
