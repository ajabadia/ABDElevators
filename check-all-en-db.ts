import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from './src/lib/db';

async function checkAllEn() {
    console.log('🔍 Revisando todas las traducciones EN en BD...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        const count = await collection.countDocuments({ locale: 'en' });
        console.log(`📊 TOTAL docs EN en base de datos: ${count}`);

        const namespaces = await collection.distinct('namespace', { locale: 'en' });
        console.log(`📊 Namespaces en EN: ${namespaces.join(', ')}`);

        const rootKeys = await collection.find({ locale: 'en' }).limit(5).toArray();
        console.log('📝 Muestra de llaves EN:');
        console.log(rootKeys.map(k => `${k.key}: ${k.value}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAllEn();
