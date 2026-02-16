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

async function syncTenants() {
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

        const mainConfigs = await mainDb.collection('tenant_configs').find({
            tenantId: { $in: ['abd_global', 'default_tenant', 'elevadores_mx'] }
        }).toArray();

        console.log(`Found ${mainConfigs.length} configs in Main DB`);

        for (const config of mainConfigs) {
            const { _id, ...cleanConfig } = config;

            // Sync to 'tenants' collection in Auth DB
            const result = await authDb.collection('tenants').updateOne(
                { tenantId: config.tenantId },
                { $set: cleanConfig },
                { upsert: true }
            );

            console.log(`Synced ${config.tenantId}: ${result.upsertedCount > 0 ? 'CREATED' : 'UPDATED'}`);

            // Also ensure it exists in 'organizations' if needed by some parts of the system
            await authDb.collection('organizations').updateOne(
                { tenantId: config.tenantId },
                { $set: { name: config.name, tenantId: config.tenantId, active: true } },
                { upsert: true }
            );
        }

        // Verify users have tenantAccess
        const usersCol = authDb.collection('users');
        const adminUser = await usersCol.findOne({ email: /ajabadia/i });
        if (adminUser) {
            console.log(`Found admin user: ${adminUser.email}`);
            const tenantAccess = [
                { tenantId: 'abd_global', name: 'ABD Global', role: 'SUPER_ADMIN', industry: 'ELEVATORS' },
                { tenantId: 'default_tenant', name: 'Default Tenant', role: 'SUPER_ADMIN', industry: 'ELEVATORS' },
                { tenantId: 'elevadores_mx', name: 'Elevadores MX', role: 'SUPER_ADMIN', industry: 'ELEVATORS' }
            ];

            await usersCol.updateOne(
                { _id: adminUser._id },
                { $set: { tenantAccess } }
            );
            console.log('Updated tenantAccess for admin user.');
        }

    } catch (e: any) {
        console.error('Sync Error:', e.message);
    } finally {
        await mainClient.close();
        await authClient.close();
    }
}

syncTenants();
