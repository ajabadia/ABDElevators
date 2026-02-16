import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { TranslationService } from '../src/lib/translation-service';
import { getTenantCollection } from '../src/lib/db-tenant';
import { connectDB } from '../src/lib/db';

/**
 * Script de Consolidación i18n
 * Asigna 'platform_master' a todos los registros que no tengan tenantId o sean 'unknown'.
 * También asegura que isObsolete sea siempre false para estos registros.
 */
async function consolidateI18n() {
    console.log('--- 🧹 Iniciando Consolidación i18n ---');
    try {
        const collection = await getTenantCollection('i18n_translations', { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } });

        // 1. Encontrar registros huérfanos
        const orphans = await collection.unsecureRawCollection.find({
            tenantId: { $in: [null, undefined, 'unknown'] as any }
        }).toArray();

        console.log(`🔍 Encontrados ${orphans.length} registros huérfanos.`);

        if (orphans.length > 0) {
            // 2. Consolidar en platform_master
            const result = await collection.unsecureRawCollection.updateMany(
                { tenantId: { $in: [null, undefined, 'unknown'] as any } },
                {
                    $set: {
                        tenantId: 'platform_master',
                        isObsolete: false,
                        lastUpdated: new Date()
                    }
                }
            );
            console.log(`✅ Consolidados ${result.modifiedCount} registros en 'platform_master'.`);
        }

        // 3. Eliminar duplicados potenciales (opcional pero recomendado)
        // Si ahora tenemos dos registros con la misma llave/locale para platform_master,
        // MongoDB los tratará como dos documentos. El más reciente debería ganar.

        console.log('--- ✨ Consolidación Finalizada ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante la consolidación:', error);
        process.exit(1);
    }
}

consolidateI18n();
