import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from './src/lib/db';

async function verify() {
    console.log('🔍 Verificando base de datos para locale EN...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        const enKeys = await collection.find({ locale: 'en', key: { $regex: '^common\\.spaces' } }).toArray();
        console.log(`📊 TOTAL keys en 'en' que empiezan por 'common.spaces': ${enKeys.length}`);

        if (enKeys.length > 0) {
            console.log('📝 Muestra de 5 keys:');
            console.log(enKeys.slice(0, 5).map((t: any) => `${t.key}: ${t.value}`));
        } else {
            console.log('❌ No se encontraron keys con \'common.spaces\' para \'en\'');

            // Check if they exist WITHOUT common.
            const rawSpaces = await collection.find({ locale: 'en', key: { $regex: 'spaces' } }).toArray();
            console.log(`📊 TOTAL keys en 'en' que contienen 'spaces': ${rawSpaces.length}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
