import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from './src/lib/db';

async function fixTenants() {
    console.log('🧹 Corrigiendo tenantId faltantes en translations...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        // 1. Identificar registros para reportar antes del fix
        const count = await collection.countDocuments({
            $or: [
                { tenantId: { $exists: false } },
                { tenantId: "undefined" },
                { tenantId: null }
            ]
        });

        console.log(`📊 Encontrados ${count} registros sin tenantId válido.`);

        if (count > 0) {
            const result = await collection.updateMany(
                {
                    $or: [
                        { tenantId: { $exists: false } },
                        { tenantId: "undefined" },
                        { tenantId: null }
                    ]
                },
                { $set: { tenantId: 'platform_master' } }
            );
            console.log(`✅ Se actualizaron ${result.modifiedCount} registros.`);
        } else {
            console.log('ℹ️ No se requieren actualizaciones.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixTenants();
