import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { PromptService } from '../src/lib/prompt-service';
import { connectDB } from '../src/lib/db';
import { getTenantCollection } from '../src/lib/db-tenant';

async function syncAndVerify() {
    console.log('🚀 Iniciando sincronización de Prompts de WorkContext...');

    try {
        // Asegurar conexión a DB
        await connectDB();
        console.log('📡 Conexión a DB establecida.');

        // 1. Sincronizar fallbacks (esto cargará los nuevos WORK_CONTEXT_* de prompts.ts)
        const result = await PromptService.syncFallbacks('abd_global');
        console.log('\n📊 Resumen de sincronización (abd_global):');
        console.log(`- Creados: ${result.created}`);
        console.log(`- Actualizados: ${result.updated}`);
        console.log(`- Errores: ${result.errors}`);

        // 2. Verificar específicamente los prompts de WorkContext
        console.log('\n🔍 Verificando prompts de WorkContext en la DB...');
        const collection = await getTenantCollection('prompts');
        const workContextKeys = [
            'WORK_CONTEXT_INSPECTION',
            'WORK_CONTEXT_MAINTENANCE',
            'WORK_CONTEXT_ENGINEERING',
            'WORK_CONTEXT_ADMIN'
        ];

        const foundPrompts = await collection.find({
            key: { $in: workContextKeys },
            tenantId: 'abd_global'
        });

        console.log(`- Encontrados: ${foundPrompts.length} / ${workContextKeys.length}`);

        const missing = workContextKeys.filter(key => !foundPrompts.find(p => p.key === key));
        if (missing.length > 0) {
            console.error('❌ Faltan los siguientes prompts en la DB:', missing.join(', '));
            process.exit(1);
        }

        console.log('\n✅ Todos los prompts de WorkContext están sincronizados y verificados.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante la sincronización/verificación:', error);
        process.exit(1);
    }
}

syncAndVerify();
