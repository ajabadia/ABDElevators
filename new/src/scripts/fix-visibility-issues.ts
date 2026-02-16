import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) return;

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        const targetTenantId = process.env.SINGLE_TENANT_ID || 'default_tenant';
        console.log(`🎯 Target Tenant: ${targetTenantId}`);

        // 1. Seed tenant if missing
        const tenantsCol = db.collection('tenants');
        const existingTenant = await tenantsCol.findOne({ tenantId: targetTenantId });
        if (!existingTenant) {
            await tenantsCol.insertOne({
                tenantId: targetTenantId,
                name: 'Cliente por Defecto',
                domain: 'localhost',
                active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(`✅ Tenant "${targetTenantId}" creado.`);
        }

        // 2. Remove global prompts that conflict with local ones
        const promptsCol = db.collection('prompts');
        const result = await promptsCol.deleteMany({
            tenantId: 'global',
            key: { $in: ['GRAPH_EXTRACTOR', 'QUERY_ENTITY_EXTRACTOR', 'RAG_JUDGE'] }
        });
        console.log(`🗑️ Borrados ${result.deletedCount} prompts globales obsoletos.`);

    } finally {
        await client.close();
    }
}

main();
