import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { TranslationService } from './src/lib/translation-service';
import { connectDB } from './src/lib/db';

async function dumpSpacesEn() {
    console.log('🧪 Dumpeando llaves de "common.spaces" para EN...');
    try {
        await connectDB();

        const enMessages = await TranslationService.getMessages('en', 'platform_master');

        function nestToFlat(obj: any, prefix = ''): Record<string, string> {
            const result: Record<string, string> = {};
            if (!obj) return result;
            for (const key in obj) {
                const value = obj[key];
                const newKey = prefix ? `${prefix}.${key}` : key;
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    Object.assign(result, nestToFlat(value, newKey));
                } else {
                    result[newKey] = String(value);
                }
            }
            return result;
        }

        const flat = nestToFlat(enMessages);
        const spacesKeys = Object.keys(flat).filter(k => k.startsWith('common.spaces.'));

        console.log(`\n📊 Total llaves common.spaces.* encontradas: ${spacesKeys.length}`);

        spacesKeys.sort().forEach(k => {
            console.log(`   - ${k}: "${flat[k]}"`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

dumpSpacesEn();
