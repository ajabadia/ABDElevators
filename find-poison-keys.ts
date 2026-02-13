import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from './src/lib/db';

async function findPoisonKeys() {
    console.log('🔍 Buscando llaves "venenosas" (prefijos que chocan con estructuras)...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        const allDocs = await collection.find({ isObsolete: false }).toArray();
        const keysByLocale = new Map<string, string[]>();

        for (const doc of allDocs) {
            const locale = doc.locale;
            if (!keysByLocale.has(locale)) keysByLocale.set(locale, []);
            keysByLocale.get(locale)!.push(doc.key);
        }

        let poisonedCount = 0;
        for (const [locale, keys] of keysByLocale.entries()) {
            console.log(`\nLocale: ${locale}`);
            const sortedKeys = [...keys].sort();

            for (let i = 0; i < sortedKeys.length; i++) {
                const current = sortedKeys[i];
                // Si la siguiente llave empieza por "current." significa que current es un nodo intermedio pero existe como valor (string)
                for (let j = 0; j < sortedKeys.length; j++) {
                    if (i === j) continue;
                    if (sortedKeys[j].startsWith(`${current}.`)) {
                        console.log(`   ❌ COLISIÓN: "${current}" es un valor string pero tiene sub-llaves como "${sortedKeys[j]}"`);
                        poisonedCount++;

                        // Encontrar los documentos exactos para informar
                        const docs = allDocs.filter(d => d.key === current && d.locale === locale);
                        for (const d of docs) {
                            console.log(`      -> Tenant: ${d.tenantId}, ID: ${d._id}`);
                        }
                        break;
                    }
                }
            }
        }

        console.log(`\n📊 Total colisiones encontradas: ${poisonedCount}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findPoisonKeys();
