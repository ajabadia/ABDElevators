import { ICaseWorkflowRepository } from '../../domain/repositories/ICaseWorkflowRepository';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';

export class MongoCaseWorkflowRepository implements ICaseWorkflowRepository {
    async createTask(task: any): Promise<void> {
        const collection = await getTenantCollection<any>('workflow_tasks', { user: { tenantId: task.tenantId } });
        await collection.insertOne({
            ...task,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    async updateEntity(entitySlug: string, id: any, updates: any, tenantId: string): Promise<void> {
        const collection = await getTenantCollection<any>(entitySlug, { user: { tenantId } });
        const filter = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
        await collection.updateOne(filter as any, {
            $set: {
                ...updates,
                updatedAt: new Date()
            }
        });
    }
}
