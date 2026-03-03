import { MongoClient, ObjectId } from 'mongodb';
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

async function migrate() {
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

        // 1. Sync Tenants to Auth Cluster (Critical fix for 500 errors)
        console.log('--- 🏢 Syncing Tenants ---');
        const tenantIds = ['abd_global', 'default_tenant', 'elevadores_mx'];
        const mainTenants = await mainDb.collection('tenant_configs').find({
            tenantId: { $in: tenantIds }
        }).toArray();

        for (const tenantId of tenantIds) {
            const config = mainTenants.find(t => t.tenantId === tenantId);
            if (config) {
                const { _id, ...cleanConfig } = config;
                await authDb.collection('tenants').updateOne(
                    { tenantId },
                    { $set: cleanConfig },
                    { upsert: true }
                );
                console.log(`Synced ${tenantId} to Auth DB`);
            } else {
                // Provision basic if missing
                await authDb.collection('tenants').updateOne(
                    { tenantId },
                    {
                        $set: {
                            tenantId,
                            name: tenantId === 'abd_global' ? 'ABD Global' : tenantId,
                            industry: 'ELEVATORS',
                            active: true,
                            storage: { provider: 'cloudinary', settings: {}, quota_bytes: 1073741824 }
                        }
                    },
                    { upsert: true }
                );
                console.log(`Provisioned basic ${tenantId} to Auth DB (missing in Main)`);
            }
        }

        // 2. Migrate Document Types (Main DB)
        console.log('\n--- 📄 Migrating Document Types ---');
        const docTypesCol = mainDb.collection('document_types');

        // Update existing ones to be 'RAG_ASSET' and belong to 'abd_global' (standard)
        const updateResult = await docTypesCol.updateMany(
            { tenantId: { $exists: false } },
            { $set: { tenantId: 'abd_global', category: 'RAG_ASSET' } }
        );
        console.log(`Updated ${updateResult.modifiedCount} document types to global RAG category`);

        // 3. Recover Historical Types (tipos_documento_migrated_...)
        const collections = await mainDb.listCollections().toArray();
        const legacyColName = collections.find(c => c.name.startsWith('tipos_documento_migrated'))?.name;

        if (legacyColName) {
            console.log(`\nRecovering types from ${legacyColName}...`);
            const legacyTypes = await mainDb.collection(legacyColName).find({}).toArray();
            for (const lt of legacyTypes) {
                if (!lt.nombre) continue;
                await docTypesCol.updateOne(
                    { name: lt.nombre },
                    {
                        $set: {
                            name: lt.nombre,
                            description: lt.descripcion || '',
                            tenantId: 'abd_global', // Legacy ones are usually global
                            category: 'RAG_ASSET',
                            isActive: true,
                            createdAt: lt.creado || new Date()
                        }
                    },
                    { upsert: true }
                );
                console.log(`  Recovered: ${lt.nombre}`);
            }
        }

        // 4. Seed basic User Document types if missing
        const userDocTypes = [
            'Pedido de Venta',
            'Contrato de Mantenimiento',
            'Albarán de Entrega',
            'Factura',
            'Certificado Técnico'
        ];

        for (const name of userDocTypes) {
            await docTypesCol.updateOne(
                { name, category: 'USER_DOCUMENT' },
                {
                    $set: {
                        name,
                        tenantId: 'abd_global',
                        category: 'USER_DOCUMENT',
                        isActive: true,
                        createdAt: new Date()
                    }
                },
                { upsert: true }
            );
        }
        console.log('\nSeed basic USER_DOCUMENT types completed.');

    } catch (e: any) {
        console.error('Migration Error:', e.message);
    } finally {
        await mainClient.close();
        await authClient.close();
    }
}

migrate();
