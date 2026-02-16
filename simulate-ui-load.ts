import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { TranslationService } from './src/lib/translation-service';

async function simulateUi() {
    console.log('🧪 Simulando carga de traducciones para la UI (EN)...');
    try {
        const messages = await TranslationService.getMessages('en', 'platform_master');

        console.log('✅ common.spaces en el objeto anidado:');
        if (messages.common && messages.common.spaces) {
            console.log(JSON.stringify(messages.common.spaces, null, 2).substring(0, 1000));

            const keys = Object.keys(messages.common.spaces);
            console.log(`📊 Total sub-claves encontradas en common.spaces: ${keys.length}`);
            if (keys.length > 5) {
                console.log('Muestra de claves:', keys.slice(0, 10));
            }
        } else {
            console.log('❌ NO se encontró common.spaces en los mensajes cargados.');
            console.log('Estructura de common:', Object.keys(messages.common || {}));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

simulateUi();
