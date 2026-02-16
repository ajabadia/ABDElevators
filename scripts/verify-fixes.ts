import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
};

const mainUri = getEnv('MONGODB_URI');
const authUri = getEnv('MONGODB_AUTH_URI') || getEnv('MONGODB_URI');

async function verify() {
    if (!mainUri || !authUri) {
        console.error('Missing URIs');
        return;
    }

    const mainClient = new MongoClient(mainUri);
    const authClient = new MongoClient(authUri);

    try {
        await mainClient.connect();
        await authClient.connect();

        const mainDb = mainClient.db('ABDElevators');
        const authDb = authClient.db('ABDElevators-Auth');

        console.log('--- 🏢 Auth Cluster Verification ---');
        const tenants = await authDb.collection('tenants').find({
            tenantId: { $in: ['abd_global', 'default_tenant', 'elevadores_mx'] }
        }).toArray();
        console.log(`Found ${tenants.length} tenants in Auth DB:`, tenants.map(t => t.tenantId));

        console.log('\n--- 📄 Document Types Verification (Main DB) ---');
        const docTypes = await mainDb.collection('document_types').find({}).toArray();
        console.log(`Total Document Types: ${docTypes.length}`);

        const categories = docTypes.reduce((acc, dt) => {
            acc[dt.category] = (acc[dt.category] || 0) + 1;
            return acc;
        }, {} as any);
        console.log('Categories found:', categories);

        const tenantsFound = docTypes.reduce((acc, dt) => {
            acc[dt.tenantId] = (acc[dt.tenantId] || 0) + 1;
            return acc;
        }, {} as any);
        console.log('Tenants associated:', tenantsFound);

        const sample = docTypes.slice(0, 3);
        console.log('\nSample Document Types:');
        sample.forEach(s => console.log(` - ${s.name} (${s.category}) [Tenant: ${s.tenantId}]`));

    } catch (e: any) {
        console.error('Verification Error:', e.message);
    } finally {
        await mainClient.close();
        await authClient.close();
    }
}

verify();
