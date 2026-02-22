import dotenv from 'dotenv';
import path from 'path';
import { MongoClient } from 'mongodb';
import { PROMPTS } from '../lib/prompts';
import { PromptSchema } from '../lib/schemas';
import { AI_MODEL_IDS } from '@abd/platform-core';

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
        }

        for (const [key, template] of Object.entries(PROMPTS)) {
            const newPrompt = {
                key,
                name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
                description: `Prompt maestro sincronizado: ${key}`,
                category: key.includes('CAUSAL') ? 'ANALYSIS' : 'GENERAL',
                industry: key.includes('CAUSAL') ? 'REAL_ESTATE' : 'GENERIC',
                template,
                variables: [],
                model: key.includes('JUDGE') ? AI_MODEL_IDS.GEMINI_3_PRO_PREVIEW : AI_MODEL_IDS.GEMINI_2_5_FLASH,
                tenantId: targetTenantId,
                active: true,
                version: 1,
                environment: 'PRODUCTION',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            try {
                const validated = PromptSchema.parse(newPrompt);
                await promptsCollection.updateOne(
                    { key, tenantId: targetTenantId, environment: 'PRODUCTION' },
                    { $set: validated },
                    { upsert: true }
                );
                console.log(`✅ [SYNC] Prompt "${key}" sincronizado.`);
            } catch (err: any) {
                console.error(`❌ Error sincronizando prompt "${key}":`, err.message);
            }
        }

        await promptsCollection.deleteMany({ tenantId: 'global' });
        console.log('\n✅ Sincronización completada.');
    } catch (error) {
        console.error('❌ Error de conexión:', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

syncMasterPrompts();
