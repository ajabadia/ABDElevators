import { getTenantCollection } from '@/lib/db-tenant';
import { getSystemSession } from '@/lib/sessions/system-session';
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
        const session = getSystemSession(effectiveTenantId);
        const collection = await getTenantCollection(this.COLLECTION, session, 'CONFIG');

        return await collection.find({
            locale,
            tenantId: effectiveTenantId,
            isObsolete: { $ne: true }
        }).toArray();
    }

    /**
     * Actualiza un set de traducciones en batch (bulkWrite).
     */
    static async bulkUpdate(operations: AnyBulkWriteOperation<Document>[], tenantId: string) {
        const session = getSystemSession(tenantId);
        const collection = await getTenantCollection(this.COLLECTION, session);

        if (operations.length === 0) return { matchedCount: 0, modifiedCount: 0 };
        return await (collection as any).unsecureRawCollection.bulkWrite(operations);
    }

    /**
     * Actualiza una única traducción con upsert.
     */
    static async updateOne(filter: Record<string, unknown>, update: Record<string, unknown>) {
        const session = getSystemSession('platform_master');
        const collection = await getTenantCollection(this.COLLECTION, session, 'CONFIG');

        const result = await (collection as any).unsecureRawCollection.updateOne(
            { ...filter, tenantId: 'platform_master' },
            update,
            { upsert: true }
        );
        return result;
    }

    /**
     * Marca una traducción como obsoleta.
     */
    static async markObsolete(key: string, locale: string, tenantId: string) {
        const session = getSystemSession(tenantId);
        const collection = await getTenantCollection(this.COLLECTION, session);

        return await collection.updateOne(
            { key, locale, tenantId },
            { $set: { isObsolete: true, lastUpdated: new Date(), updatedBy: 'SYSTEM_DELETE' } }
        );
    }
}
