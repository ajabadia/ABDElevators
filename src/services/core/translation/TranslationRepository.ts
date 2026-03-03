
import { getTenantCollection } from '@/lib/db-tenant';
import { AnyBulkWriteOperation, Document } from 'mongodb';

/**
 * 🏛️ Translation Repository
 * Proposito: Abstracción de acceso a la base de datos para la colección 'translations'.
 */
export class TranslationRepository {
    private static COLLECTION = 'translations';

    /**
     * Obtiene todos los mensajes para un locale y tenant.
     */
    static async findMessages(locale: string, tenantId: string) {
        const effectiveTenantId = tenantId || 'platform_master';
        const collection = await getTenantCollection(this.COLLECTION, {
            user: { id: 'system', tenantId: effectiveTenantId, role: 'SUPER_ADMIN' }
        } as unknown as Parameters<typeof getTenantCollection>[1]);

        return await collection.find({
            locale,
            tenantId: effectiveTenantId,
            isObsolete: { $ne: true }
        });
    }

    /**
     * Actualiza un set de traducciones en batch (bulkWrite).
     */
    static async bulkUpdate(operations: AnyBulkWriteOperation<Document>[], tenantId: string) {
        const collection = await getTenantCollection(this.COLLECTION, {
            user: { id: 'system', tenantId, role: 'SUPER_ADMIN' }
        } as unknown as Parameters<typeof getTenantCollection>[1]);

        if (operations.length === 0) return { matchedCount: 0, modifiedCount: 0 };
        return await collection.unsecureRawCollection.bulkWrite(operations);
    }

    /**
     * Actualiza una única traducción con upsert.
     */
    static async updateOne(filter: Record<string, unknown>, update: Record<string, unknown>) {
        const collection = await getTenantCollection(this.COLLECTION, {
            user: { id: 'system', tenantId: 'platform_master', role: 'SUPER_ADMIN' }
        } as unknown as Parameters<typeof getTenantCollection>[1]);

        console.log(`[TranslationRepository] EXECUTING UPDATE:`, {
            filter: { ...filter, tenantId: 'platform_master' },
            updateKeys: Object.keys(update.$set || {})
        });

        const result = await collection.unsecureRawCollection.updateOne(
            { ...filter, tenantId: 'platform_master' },
            update,
            { upsert: true }
        );
        console.log(`[TranslationRepository] DB Result ->`, {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            upsertedId: result.upsertedId
        });
        return result;
    }

    /**
     * Marca una traducción como obsoleta.
     */
    static async markObsolete(key: string, locale: string, tenantId: string) {
        const collection = await getTenantCollection(this.COLLECTION, {
            user: { id: 'system', tenantId, role: 'SUPER_ADMIN' }
        } as unknown as Parameters<typeof getTenantCollection>[1]);

        return await collection.updateOne(
            { key, locale, tenantId },
            { $set: { isObsolete: true, lastUpdated: new Date(), updatedBy: 'SYSTEM_DELETE' } }
        );
    }
}
