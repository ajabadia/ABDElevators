import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from './src/lib/db';

async function scanRootCollisions() {
    console.log('🔍 Escaneando colisiones de raíz (key: "common" o "common.spaces")...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        const suspects = ['common', 'common.spaces', 'common.navigation', 'common.search'];

        const docs = await collection.find({
            key: { $in: suspects }
        }).toArray();

        console.log(`📊 TOTAL docs sospechosos encontrados: ${docs.length}`);
        for (const doc of docs) {
            console.log(`   - ID: ${doc._id}, Key: ${doc.key}, Locale: ${doc.locale}, Tenant: ${doc.tenantId}, Value: "${doc.value}"`);
        }

        // También buscar cualquier cosa que no tenga un punto (raíz pura)
        const rootPure = await collection.find({
            key: { $not: /\./ }
        }).toArray();
        console.log(`📊 TOTAL docs raíz pura encontrados: ${rootPure.length}`);
        for (const doc of rootPure) {
            console.log(`   - Key: ${doc.key}, Locale: ${doc.locale}, Value: "${doc.value}"`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

scanRootCollisions();
