import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from './src/lib/db';

async function verifyEn() {
    console.log('🔍 Buscando llaves EN de common.spaces...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        const docs = await collection.find({
            locale: 'en',
            key: { $regex: '^common\\.spaces' }
        }).toArray();

        console.log(`📊 TOTAL docs EN encontrados: ${docs.length}`);
        for (const doc of docs) {
            console.log(`   - Key: ${doc.key}, Tenant: ${doc.tenantId}, Value: "${doc.value}"`);
        }

        // También buscar ES para comparar
        const esCount = await collection.countDocuments({
            locale: 'es',
            key: { $regex: '^common\\.spaces' }
        });
        console.log(`📊 TOTAL docs ES encontrados: ${esCount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verifyEn();
