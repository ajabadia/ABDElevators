import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from './src/lib/db';

async function checkStatus() {
    console.log('🔍 Revisando estado de llaves common.spaces...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        const docs = await collection.find({
            key: { $regex: '^common\\.spaces' }
        }).toArray();

        console.log(`📊 TOTAL docs encontrados para common.spaces: ${docs.length}`);

        const summary = docs.reduce((acc: any, doc: any) => {
            const locale = doc.locale;
            acc[locale] = acc[locale] || { total: 0, obsolete: 0, namespaces: new Set() };
            acc[locale].total++;
            if (doc.isObsolete) acc[locale].obsolete++;
            acc[locale].namespaces.add(doc.namespace);
            return acc;
        }, {});

        for (const locale in summary) {
            console.log(`🌍 Locale: ${locale}`);
            console.log(`   - Total: ${summary[locale].total}`);
            console.log(`   - Obsoletas: ${summary[locale].obsolete}`);
            console.log(`   - Namespaces únicos: ${Array.from(summary[locale].namespaces).join(', ')}`);

            if (summary[locale].total > 0) {
                const sample = docs.find((d: any) => d.locale === locale);
                console.log(`   - Ejemplo: ${sample.key} -> ${sample.value}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStatus();
