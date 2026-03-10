
import * as dotenv from 'dotenv';
import path from 'path';
import { TranslationService } from '../src/services/core/translation-service';
import { connectDB } from '@abd/platform-core/server';

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function debug() {
    await connectDB();
    const key = process.argv[2] || 'common.breadcrumbs.help';
    const locale = process.argv[3] || 'es';

    console.log(`🔍 Debugging key: ${key} [${locale}]`);
    const info = await TranslationService.getKeyDebugInfo(locale, key);
    console.log(JSON.stringify(info, null, 2));
    process.exit(0);
}

debug();
