import { connectDB } from '../../src/lib/db';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkTranslation(key: string, locale: string) {
    console.log(`Checking translation for key: ${key}, locale: ${locale}`);
    const db = await connectDB();
    const collection = db.collection('translations');

    const results = await collection.find({ key, locale }).toArray();
    console.log(`Found ${results.length} entries:`);
    results.forEach(d => {
        console.log(`- Tenant: ${d.tenantId}, Value: "${d.value}", Obsolete: ${d.isObsolete}, Customized: ${d.isCustomized}`);
    });

    // Also check if the namespace as a whole is shadowed
    const namespace = key.split('.')[0];
    const nsResults = await collection.find({ namespace, locale, tenantId: '000000000000000000000000' }).limit(5).toArray();
    console.log(`\nSample from namespace ${namespace} (Master):`);
    nsResults.forEach(d => {
        console.log(`- ${d.key}: "${d.value}"`);
    });

    process.exit(0);
}

const key = process.argv[2] || 'knowledge_assets.actions.manage_spaces';
const locale = process.argv[3] || 'es';

checkTranslation(key, locale).catch(err => {
    console.error(err);
    process.exit(1);
});
