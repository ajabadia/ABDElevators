import { TranslationService } from '../src/services/core/translation-service';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function sync() {
    console.log('--- 🌐 i18n Sync Tool ---');
    console.log('Iniciando sincronización forzada de todas las traducciones locales...');

    try {
        const result = await TranslationService.forceSyncAllLocales('platform_master');

        console.log('\n--- ✅ Resultados de Sincronización ---');
        Object.entries(result).forEach(([locale, count]) => {
            console.log(`${locale.toUpperCase()}: ${count} llaves sincronizadas.`);
        });

        console.log('\nSincronización completada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error durante la sincronización:', error);
        process.exit(1);
    }
}

sync();
