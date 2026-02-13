import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from './src/lib/db';
import { TranslationService } from './src/lib/translation-service';

async function verify() {
    console.log('🧪 Verificando integridad de i18n...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        // 1. Verificar si getMessages todavía crashea
        console.log('   - Probando TranslationService.getMessages("es")...');
        try {
            const messages = await TranslationService.getMessages('es', 'platform_master');
            console.log('   ✅ getMessages("es") cargó exitosamente.');
        } catch (e: any) {
            console.error('   ❌ getMessages("es") falló:', e.message);
        }

        // 2. Buscar posibles colisiones residuales en TODA la base de datos
        console.log('\n🔍 Escaneando toda la BD en busca de colisiones (Leaf vs Object)...');
        const allKeys = await collection.distinct('key');
        const keySet = new Set(allKeys);
        let issues = 0;

        for (const key of allKeys) {
            // Un error ocurre si 'key.algo' también existe como llave
            const searchPrefix = key + '.';
            const hasChildren = allKeys.some(k => k.startsWith(searchPrefix));

            if (hasChildren) {
                console.log(`⚠️  LLAVE ILEGAL DETECTADA: "${key}" existe como string pero también tiene hijos.`);
                issues++;
            }
        }

        if (issues === 0) {
            console.log('✅ No se detectaron más colisiones en la base de datos.');
        } else {
            console.log(`❌ Se detectaron ${issues} colisiones adicionales.`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
