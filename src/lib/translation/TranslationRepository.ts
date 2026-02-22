
import { getTenantCollection } from '../db-tenant';
import { ObjectId } from 'mongodb';

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
        // Usamos plataforma master si no se especifica tenant
        const effectiveTenantId = tenantId || 'platform_master';
        const collection = await getTenantCollection(this.COLLECTION, {
            user: { id: 'system', tenantId: effectiveTenantId, role: 'SUPER_ADMIN' }
        } as any);

        return await collection.find({
            locale,
            tenantId: effectiveTenantId,
            isObsolete: { $ne: true } as any
        });
    }

    /**
     * Actualiza un set de traducciones en batch (bulkWrite).
     */
    static async bulkUpdate(operations: any[], tenantId: string) {
        const collection = await getTenantCollection(this.COLLECTION, {
            user: { id: 'system', tenantId, role: 'SUPER_ADMIN' }
        } as any);

        if (operations.length === 0) return { matchedCount: 0, modifiedCount: 0 };
        return await collection.unsecureRawCollection.bulkWrite(operations);
    }

    /**
     * Actualiza una única traducción con upsert.
     */
    static async updateOne(filter: any, update: any) {
        // En i18n siempre usamos rol de sistema
        const collection = await getTenantCollection(this.COLLECTION, {
            user: { id: 'system', tenantId: 'platform_master', role: 'SUPER_ADMIN' }
        } as any);

        return await collection.updateOne(filter, update, { upsert: true });
    }

    /**
     * Marca una traducción como obsoleta.
     */
    static async markObsolete(key: string, locale: string, tenantId: string) {
        const collection = await getTenantCollection(this.COLLECTION, {
            user: { id: 'system', tenantId, role: 'SUPER_ADMIN' }
        } as any);

        return await collection.updateOne(
            { key, locale, tenantId },
            { $set: { isObsolete: true, lastUpdated: new Date(), updatedBy: 'SYSTEM_DELETE' } }
        );
    }
}
