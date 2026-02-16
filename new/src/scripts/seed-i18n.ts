import { TranslationService } from '@/lib/translation-service';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seed() {
    console.log('🚀 Iniciando migración de i18n a MongoDB...');

    const locales = ['es', 'en'];

    for (const locale of locales) {
        console.log(`\n📦 Procesando idioma: ${locale}`);

        try {
            // getMessages disparará la sincronización automática si no hay datos en DB
            const messages = await TranslationService.getMessages(locale);
            const count = Object.keys(messages).length;
            console.log(`✅ Sincronizados ${count} namespaces/llaves para '${locale}'`);
        } catch (error) {
            console.error(`❌ Error migrando '${locale}':`, error);
        }
    }

    console.log('\n✨ Migración completada.');
    process.exit(0);
}

seed();
