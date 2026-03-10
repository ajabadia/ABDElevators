import { getTenantCollection } from '@/lib/db-tenant';
import { TaxonomySchema, IndustryType } from '@/lib/schemas';
import { TenantIdSchema, EntityIdSchema } from '@abd/platform-core';
import { ObjectId } from 'mongodb';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

export class TaxonomyService {
    /**
     * Obtiene todas las taxonomías activas para un tenant e industria.
     */
    static async getTaxonomies(tenantId: string, industry: IndustryType) {
        const collection = await getTenantCollection('taxonomias');
        const tId = TenantIdSchema.parse(tenantId);
        return await collection.find({
            tenantId: tId,
            industry,
            active: true
        } as any);
    }

    /**
     * Crea una nueva taxonomía.
     */
    static async createTaxonomy(data: Record<string, unknown>, correlationId: string) {
        const validated = TaxonomySchema.parse(data);
        const collection = await getTenantCollection('taxonomias');

        const existing = await collection.findOne({
            tenantId: validated.tenantId,
            industry: validated.industry,
            key: validated.key
        } as any);

        if (existing) {
            throw new ValidationError(`La clave de taxonomía '${validated.key}' ya existe para esta industria`);
        }

        const result = await collection.insertOne(validated as any);

        await logEvento({
            level: 'INFO',
            source: 'TAXONOMY_SERVICE',
            action: 'CREATE_TAXONOMY',
            message: `Taxonomía '${validated.name}' creada para tenant ${validated.tenantId}`,
            correlationId,
            details: { key: validated.key, industry: validated.industry }
        });

        return { ...validated, _id: result.insertedId };
    }

    static async updateTaxonomy(id: string, data: Record<string, unknown>, tenantId: string, correlationId: string) {
        const collection = await getTenantCollection('taxonomias');
        const tId = TenantIdSchema.parse(tenantId);
        const existing = await collection.findOne({ _id: new ObjectId(id), tenantId: tId } as any);

        if (!existing) throw new NotFoundError('Taxonomía no encontrada');

        const updateData = { ...data, updatedAt: new Date() };
        await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

        await logEvento({
            level: 'INFO',
            source: 'TAXONOMY_SERVICE',
            action: 'UPDATE_TAXONOMY',
            message: `Taxonomía ${id} actualizada`,
            correlationId,
            details: { id, tenantId }
        });

        return { success: true };
    }

    /**
     * Actualiza múltiples taxonomías en lote (Sovereign Engine).
     */
    static async batchUpdateTaxonomies(
        updates: { targetKey: string, newName: string, newDescription?: string, action: string }[],
        tenantId: string,
        correlationId: string
    ) {
        const collection = await getTenantCollection('taxonomias');
        const tId = TenantIdSchema.parse(tenantId);

        const operations = updates.map(update => ({
            updateOne: {
                filter: { key: update.targetKey, tenantId: tId } as any,
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
            source: 'TAXONOMY_SERVICE',
            action: 'BATCH_UPDATE',
            message: `Actualización por lote completada: ${result.modifiedCount} modificados, ${result.upsertedCount} creados`,
            correlationId,
            details: { tenantId, modified: result.modifiedCount, upserted: result.upsertedCount }
        });

        return result;
    }
}
