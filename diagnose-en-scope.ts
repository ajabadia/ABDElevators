import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from './src/lib/db';

async function diagnoseEnScope() {
    console.log('🔍 Diagnosticando alcance de traducciones EN en BD...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        // 1. Contar por tenant
        const stats = await collection.aggregate([
            { $match: { locale: 'en' } },
            { $group: { _id: '$tenantId', count: { $sum: 1 }, keys: { $push: '$key' } } }
        ]).toArray();

        console.log('📊 Estadísticas por Tenant (EN):');
        for (const stat of stats) {
            console.log(`   - Tenant: ${stat._id || 'NULL'}, Cantidad: ${stat.count}`);
            if (stat._id === 'platform_master') {
                const spaces = stat.keys.filter((k: string) => k.startsWith('common.spaces.'));
                console.log(`     - common.spaces.* en platform_master: ${spaces.length}`);
            }
        }

        // 2. Verificar específicamente common.spaces.*
        const spacesDocs = await collection.find({
            key: { $regex: /^common\.spaces\./ },
            locale: 'en'
        }).toArray();

        console.log(`\n🔍 Detalle de common.spaces.* (EN): ${spacesDocs.length} documentos`);
        for (const doc of spacesDocs) {
            console.log(`   - Key: ${doc.key}, Tenant: ${doc.tenantId}, isObsolete: ${doc.isObsolete}, Value: "${doc.value}"`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

diagnoseEnScope();
