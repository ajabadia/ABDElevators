import dotenv from 'dotenv';
import path from 'path';
import { MongoClient } from 'mongodb';
import { PROMPTS } from '../lib/prompts';
import { PromptSchema } from '../lib/schemas';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function syncMasterPrompts() {
    console.log('🔄 Iniciando sincronización FORZADA de Prompts Maestros (Fase 70)...');

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI no encontrada.');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const promptsCollection = db.collection('prompts');
        const tenantsCollection = db.collection('tenants');

        const targetTenantId = process.env.SINGLE_TENANT_ID || 'default_tenant';
        console.log(`🎯 Target Tenant ID: ${targetTenantId}`);

        // 1. Asegurar que el tenant existe con el nombre correcto
        const existingTenant = await tenantsCollection.findOne({ tenantId: targetTenantId });
        if (!existingTenant) {
            await tenantsCollection.insertOne({
                tenantId: targetTenantId,
                name: 'Cliente por Defecto (ABD)',
                active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(`✅ Tenant "${targetTenantId}" creado.`);
        } else {
            await tenantsCollection.updateOne(
                { tenantId: targetTenantId },
                { $set: { name: 'Cliente por Defecto (ABD)' } }
            );
            console.log(`✅ Nombre del tenant "${targetTenantId}" actualizado.`);
        }

        // 2. Sincronizar prompts forzando PRODUCTION
        for (const [key, template] of Object.entries(PROMPTS)) {
            // Intentar encontrar el prompt existente por key, tenant y entorno
            const existing = await promptsCollection.findOne({
                key,
                tenantId: targetTenantId,
                environment: 'PRODUCTION'
            });

            if (existing) {
                console.log(`- [SKIP] Prompt "${key}" ya existe para tenant "${targetTenantId}" en PRODUCTION.`);
                continue;
            }

            // Crear nuevo objeto de prompt
            const newPrompt = {
                key,
                name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
                description: `Prompt maestro sincronizado: ${key}`,
                category: 'SYSTEM',
                template,
                variables: [],
                model: key.includes('JUDGE') ? 'gemini-1.5-pro' : 'gemini-1.5-flash',
                tenantId: targetTenantId,
                active: true,
                version: 1,
                environment: 'PRODUCTION',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            try {
                const validated = PromptSchema.parse(newPrompt);
                await promptsCollection.insertOne(validated);
                console.log(`+ [SYNC] Prompt "${key}" insertado en "${targetTenantId}" (PRODUCTION).`);
            } catch (err: any) {
                console.error(`❌ Error validando/insertando prompt "${key}":`, err.message);
            }
        }

        // 3. Limpieza de posibles duplicados en 'global'
        const result = await promptsCollection.deleteMany({ tenantId: 'global' });
        console.log(`🗑️ Borrados ${result.deletedCount} prompts globales obsoletos.`);

        console.log('\n✅ Sincronización completada.');
    } catch (error) {
        console.error('❌ Error de conexión:', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

syncMasterPrompts();
