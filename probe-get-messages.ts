import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { TranslationService } from './src/lib/translation-service';
import { connectDB } from './src/lib/db';

async function probeGetMessages() {
    console.log('🧪 Probando TranslationService.getMessages("en")...');
    try {
        await connectDB();

        const enMessages = await TranslationService.getMessages('en', 'platform_master');

        // Función para aplanar básica para debug
        function flatten(obj: any, prefix = ''): any {
            const res: any = {};
            for (const key in obj) {
                const val = obj[key];
                const fullKey = prefix ? `${prefix}.${key}` : key;
                if (typeof val === 'object' && val !== null) {
                    Object.assign(res, flatten(val, fullKey));
                } else {
                    res[fullKey] = val;
                }
            }
            return res;
        }

        const flatEn = flatten(enMessages);
        const spacesKeys = Object.keys(flatEn).filter(k => k.startsWith('common.spaces'));

        console.log(`📊 Total llaves common.spaces en EN: ${spacesKeys.length}`);
        if (spacesKeys.length > 0) {
            console.log('🔍 Muestra de llaves:');
            spacesKeys.slice(0, 5).forEach(k => console.log(`   - ${k}: "${flatEn[k]}"`));
        } else {
            console.log('❌ NO SE ENCONTRARON llaves common.spaces en el objeto retornado.');
            console.log('🔍 Raíces de common:', Object.keys(enMessages.common || {}));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

probeGetMessages();
