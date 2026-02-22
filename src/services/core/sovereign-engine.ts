import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';

/**
 * 🛰️ Sovereign Engine
 * Engine encargado de la actualización masiva y mantenimiento de taxonomías.
 */
export class SovereignEngine {
    /**
     * Actualiza múltiples taxonomías en lote.
     */
    static async batchUpdateTaxonomies(updates: any[], tenantId: string, correlationId: string) {
        const collection = await getTenantCollection('taxonomias');

        const operations = updates.map(update => ({
            updateOne: {
                filter: { key: update.targetKey, tenantId },
                update: {
                    $set: {
                        name: update.newName,
                        description: update.newDescription,
                        updatedAt: new Date(),
                        source: 'SOVEREIGN_ENGINE'
                    }
                },
                upsert: update.action === 'CREATE'
            }
        }));

        const result = await collection.bulkWrite(operations);

        await logEvento({
            level: 'INFO',
            source: 'SOVEREIGN_ENGINE',
            action: 'BATCH_UPDATE',
            message: `Mantenimiento de taxonomías completado: ${result.modifiedCount} modificadas, ${result.upsertedCount} creadas`,
            correlationId,
            tenantId,
            details: { modified: result.modifiedCount, upserted: result.upsertedCount }
        });

        return result;
    }
}
