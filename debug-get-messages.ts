import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { TranslationService } from './src/lib/translation-service';
import { connectDB } from './src/lib/db';

async function debugGetMessages() {
    const locale = 'en';
    const tenantId = 'platform_master';

    console.log(`🧪 Debugging getMessages for ${locale}/${tenantId}...`);

    // 1. JSON Local
    const local = await (TranslationService as any).loadFromLocalFile(locale);
    console.log(`   - JSON Local has common.spaces: ${!!local.common?.spaces}`);
    if (local.common?.spaces) {
        console.log(`   - JSON common.spaces keys: ${Object.keys(local.common.spaces).length}`);
    }

    // 2. DB Docs
    const db = await connectDB();
    const collection = db.collection('translations');
    const dbDocs = await collection.find({ locale, tenantId, isObsolete: false }).toArray();
    console.log(`   - DB Docs for ${locale}/${tenantId}: ${dbDocs.length}`);

    const spacesDocs = dbDocs.filter(d => d.key.startsWith('common.spaces.'));
    console.log(`   - DB Docs starting with common.spaces.: ${spacesDocs.length}`);
    if (spacesDocs.length > 0) {
        console.log(`   - Sample space key: ${spacesDocs[0].key} = "${spacesDocs[0].value}"`);
    }

    // 3. Flat to Nested
    const nestedDb = (TranslationService as any).flatToNested(dbDocs);
    console.log(`   - Nested DB has common.spaces: ${!!nestedDb.common?.spaces}`);
    if (nestedDb.common?.spaces) {
        console.log(`   - Nested DB common.spaces keys: ${Object.keys(nestedDb.common.spaces).length}`);
    }

    // 4. Merge
    const merged = (TranslationService as any).deepMerge(local, nestedDb);
    console.log(`   - Merged has common.spaces: ${!!merged.common?.spaces}`);
    if (merged.common?.spaces) {
        console.log(`   - Merged common.spaces keys: ${Object.keys(merged.common.spaces).length}`);
    }

    process.exit(0);
}

debugGetMessages();
