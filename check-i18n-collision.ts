import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from './src/lib/db';

async function checkCollision() {
    console.log('🔍 Buscando colisiones en namespaces globales...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        const locales = ['es', 'en'];
        const namespaces = ['common.spaces', 'common.search', 'common.enterpriseSecurity', 'common.security'];

        for (const locale of locales) {
            console.log(`\n🌍 Locale: ${locale}`);
            for (const ns of namespaces) {
                // Buscar la llave exacta
                const exact = await collection.findOne({ key: ns, locale });
                if (exact) {
                    console.log(`⚠️ Colisión detectada: Key "${ns}" es un string leaf node!`);
                    console.log(`   - Value: "${exact.value}", Type: ${typeof exact.value}`);

                    // Comprobar si hay llaves anidadas
                    const nestedCount = await collection.countDocuments({
                        key: { $regex: `^${ns.replace('.', '\\.')}\\.` },
                        locale
                    });
                    console.log(`   - Hijos anidados detectados: ${nestedCount}`);
                    if (nestedCount > 0) {
                        console.log(`❌ ¡ERROR FATAL! Esta llave impedirá la construcción del objeto anidado.`);
                    }
                } else {
                    console.log(`✅ Key "${ns}" no existe como leaf node (Correcto).`);
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCollision();
