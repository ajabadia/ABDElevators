import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { TranslationService } from './src/lib/translation-service';
import { connectDB } from './src/lib/db';

async function compareRoots() {
    console.log('🧪 Comparando raíces de "common" entre ES y EN...');
    try {
        await connectDB();

        const esMessages = await TranslationService.getMessages('es', 'platform_master');
        const enMessages = await TranslationService.getMessages('en', 'platform_master');

        console.log('\n🇪🇸 Roots de "common" (ES):');
        console.log(Object.keys(esMessages.common || {}));

        console.log('\n🇺🇸 Roots de "common" (EN):');
        console.log(Object.keys(enMessages.common || {}));

        const esSpaces = esMessages.common?.spaces;
        const enSpaces = enMessages.common?.spaces;

        console.log('\n🔍 common.spaces (ES):', esSpaces ? 'EXISTE' : 'FALTA');
        console.log('🔍 common.spaces (EN):', enSpaces ? 'EXISTE' : 'FALTA');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

compareRoots();
