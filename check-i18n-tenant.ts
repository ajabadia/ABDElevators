import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from './src/lib/db';

async function checkTenantId() {
    console.log('🔍 Revisando tenantId de las traducciones...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        const pipeline = [
            { $match: { key: { $regex: '^common\\.spaces' } } },
            {
                $group: {
                    _id: { locale: '$locale', tenantId: '$tenantId' },
                    count: { $sum: 1 },
                    sampleKey: { $first: '$key' }
                }
            }
        ];

        const results = await collection.aggregate(pipeline).toArray();

        console.log('📊 Agrupación de traducciones por Locale y TenantId:');
        for (const res of results) {
            console.log(`🌍 [${res._id.locale}] Tenant: "${res._id.tenantId}" -> ${res.count} llaves (Ej: ${res.sampleKey})`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTenantId();
