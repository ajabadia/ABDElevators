import { getTenantCollection } from '@/lib/db-tenant';
import { TaxonomySchema, IndustryType } from '@/lib/schemas';
import { TenantIdSchema, EntityIdSchema } from '@abd/platform-core';
import { ObjectId } from 'mongodb';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

export class TaxonomyService {
    /**
     * Retrieves all active taxonomies for a tenant and industry.
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
     * Creates a new taxonomy.
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
            throw new ValidationError(`Taxonomy key '${validated.key}' already exists for this industry`);
        }

        const result = await collection.insertOne(validated as any);

        await logEvento({
            level: 'INFO',
            source: 'TAXONOMY_SERVICE',
            action: 'CREATE_TAXONOMY',
            message: `Taxonomy '${validated.name}' created for tenant ${validated.tenantId}`,
            correlationId,
            details: { key: validated.key, industry: validated.industry }
        });

        return { ...validated, _id: result.insertedId };
    }

    static async updateTaxonomy(id: string, data: Record<string, unknown>, tenantId: string, correlationId: string) {
        const collection = await getTenantCollection('taxonomias');
        const tId = TenantIdSchema.parse(tenantId);
        const existing = await collection.findOne({ _id: new ObjectId(id), tenantId: tId } as any);

        if (!existing) throw new NotFoundError('Taxonomy not found');

        const updateData = { ...data, updatedAt: new Date() };
        await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

        await logEvento({
            level: 'INFO',
            source: 'TAXONOMY_SERVICE',
            action: 'UPDATE_TAXONOMY',
            message: `Taxonomy ${id} updated`,
            correlationId,
            details: { id, tenantId }
        });

        return { success: true };
    }

    /**
     * Updates multiple taxonomies in batch (Sovereign Engine).
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
            message: `Batch update completed: ${result.modifiedCount} modified, ${result.upsertedCount} created`,
            correlationId,
            details: { tenantId, modified: result.modifiedCount, upserted: result.upsertedCount }
        });

        return result;
    }
}
