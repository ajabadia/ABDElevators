import { ICaseRepository } from '../../domain/repositories/ICaseRepository';
import { GenericCase, GenericCaseSchema } from '@/lib/schemas';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';

export class MongoCaseRepository implements ICaseRepository {
    async findById(id: string, tenantId: string): Promise<GenericCase | null> {
        const collection = await getTenantCollection<any>('cases', { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any);
        const doc = await collection.findOne({ _id: new ObjectId(id) });
        if (!doc) return null;
        return GenericCaseSchema.parse(doc);
    }

    async updateStatus(id: string, status: string, historyEntry: any, tenantId: string): Promise<void> {
        const collection = await getTenantCollection<any>('cases', { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any);
        await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status,
                    updatedAt: new Date()
                },
                $push: { transitions_history: historyEntry }
            } as any
        );
    }

    async update(id: string, updates: Partial<GenericCase>, tenantId: string): Promise<void> {
        const collection = await getTenantCollection<any>('cases', { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any);
        await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...updates,
                    updatedAt: new Date()
                }
            } as any
        );
    }
}
