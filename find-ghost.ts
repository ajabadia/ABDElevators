import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from './src/lib/db';

async function findGhost() {
    console.log('🔍 Buscando el "fantasma" de common.spaces...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        const docs = await collection.find({
            key: 'common.spaces'
        }).toArray();

        console.log(`📊 TOTAL docs encontrados para la llave exacta: ${docs.length}`);
        for (const doc of docs) {
            console.log(`   - ID: ${doc._id}, Locale: ${doc.locale}, Tenant: ${doc.tenantId}, Value: "${doc.value}"`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findGhost();
