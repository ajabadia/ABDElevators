import dotenv from 'dotenv';
import path from 'path';
import { MongoClient } from 'mongodb';
import { PROMPTS } from '../lib/prompts';
import { PromptSchema } from '../lib/schemas';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function syncMasterPrompts() {
    console.log('🔄 Iniciando sincronización de Prompts Maestros (Fase 70)...');

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

        for (const [key, template] of Object.entries(PROMPTS)) {
            // Intentar encontrar el prompt existente por key
            const existing = await promptsCollection.findOne({ key, tenantId: 'global' });

            if (existing) {
                console.log(`- [SKIP] Prompt "${key}" ya existe en DB. Respetando persistencia.`);
                continue;
            }

            // Crear nuevo objeto de prompt
            const newPrompt = {
                key,
                name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
                description: `Prompt maestro sincronizado: ${key}`,
                category: 'SYSTEM',
                template,
                variables: [], // Se pueden inferir o añadir manualmente después
                model: key.includes('JUDGE') ? 'gemini-1.5-pro' : 'gemini-1.5-flash',
                tenantId: 'global',
                active: true,
                version: 1,
                environment: 'PRODUCTION',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            try {
                const validated = PromptSchema.parse(newPrompt);
                await promptsCollection.insertOne(validated);
                console.log(`+ [SYNC] Prompt "${key}" insertado con éxito.`);
            } catch (err: any) {
                console.error(`❌ Error validando/insertando prompt "${key}":`, err.message);
            }
        }

        console.log('\n✅ Sincronización completada.');
    } catch (error) {
        console.error('❌ Error de conexión:', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

syncMasterPrompts();
