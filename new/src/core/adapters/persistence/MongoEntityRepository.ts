import { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import { Entity, EntitySchema } from '@/lib/schemas';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';

export class MongoEntityRepository implements IEntityRepository {
    async findById(id: string, tenantId: string): Promise<Entity | null> {
        const collection = await getTenantCollection<any>('entities', { user: { tenantId } });
        const doc = await collection.findOne({ _id: new ObjectId(id) });
        if (!doc) return null;
        return EntitySchema.parse(doc);
    }

    async updateResult(id: string, results: Partial<Entity>): Promise<void> {
        const collection = await getTenantCollection<any>('entities');
        await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...results,
                    updatedAt: new Date()
                }
            }
        );
    }
}
