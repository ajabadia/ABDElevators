import { getTenantCollection } from '@/lib/db';
import { RagGoldenSetSchema, type RagGoldenSet } from '@/lib/schemas';
import { TenantIdSchema, EntityIdSchema } from '@abd/platform-core';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';

/**
 * 🎯 RagGoldenSetService
 * Phase 310: Management of RAG test collections (Golden Sets).
 */
export class RagGoldenSetService {
    /**
     * Adds a new query to a golden set.
     */
    static async addEntry(entry: Partial<RagGoldenSet>, tenantId: string, createdBy: string = 'system') {
        const validated = RagGoldenSetSchema.parse({
            ...entry,
            tenantId: TenantIdSchema.parse(tenantId),
            createdBy: EntityIdSchema.parse(createdBy),
            createdAt: new Date()
        });

        const collection = await getTenantCollection('rag_golden_sets');
        const result = await collection.insertOne(validated as any);

        await logEvento({
            level: 'INFO',
            source: 'GOLDEN_SET_SERVICE',
            action: 'ENTRY_ADDED',
            message: `New golden set entry added for tenant ${tenantId}`,
            tenantId,
            details: { query: validated.query, entryId: result.insertedId }
        });

        return result.insertedId;
    }

    /**
     * Lists queries for a specific flow and tenant.
     */
    static async listEntries(tenantId: string, flowType?: string): Promise<RagGoldenSet[]> {
        const collection = await getTenantCollection('rag_golden_sets');
        const filter: any = { tenantId };
        if (flowType) filter.flowType = flowType;

        const cursor = collection.find(filter);
        return await (cursor as any).toArray() as unknown as RagGoldenSet[];
    }

    /**
     * Bulk imports a collection of golden set entries.
     */
    static async bulkImport(entries: Partial<RagGoldenSet>[], tenantId: string, createdBy: string = 'system') {
        const validatedEntries = entries.map(e => RagGoldenSetSchema.parse({
            ...e,
            tenantId: TenantIdSchema.parse(tenantId),
            createdBy: EntityIdSchema.parse(createdBy),
            createdAt: new Date()
        }));

        const collection = await getTenantCollection('rag_golden_sets');
        const result = await collection.insertMany(validatedEntries as any);

        await logEvento({
            level: 'INFO',
            source: 'GOLDEN_SET_SERVICE',
            action: 'BULK_IMPORT',
            message: `Imported ${result.insertedCount} golden set entries for tenant ${tenantId}`,
            tenantId,
            details: { count: result.insertedCount }
        });

        return result.insertedIds;
    }

    /**
     * Deletes an entry from a golden set.
     */
    static async deleteEntry(id: string, tenantId: string) {
        const collection = await getTenantCollection('rag_golden_sets');
        const result = await collection.deleteOne({ _id: new ObjectId(id), tenantId });

        if (result.deletedCount === 0) {
            throw new AppError('NOT_FOUND', 404, 'Golden set entry not found');
        }

        return true;
    }
}
