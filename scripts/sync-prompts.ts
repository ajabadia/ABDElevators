import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { PromptService } from '../src/lib/prompt-service';
import { connectDB } from '../src/lib/db';

async function sync() {
    console.log('🚀 Iniciando sincronización de Prompts Fallback...');

    try {
        // Asegurar conexión a DB
        await connectDB();
        console.log('📡 Conexión a DB establecida.');

        // Sincronizar (por defecto a abd_global)
        const result = await PromptService.syncFallbacks();

        console.log('\n📊 Resumen de sincronización:');
        console.log(`- Creados: ${result.created}`);
        console.log(`- Errores: ${result.errors}`);
        console.log(`- Existentes/Variantes: ${result.updated} (vía check manual)`);

        console.log('\n✅ Sincronización completada.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante la sincronización:', error);
        process.exit(1);
    }
}

sync();
