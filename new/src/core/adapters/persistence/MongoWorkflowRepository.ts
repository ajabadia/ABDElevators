import { IWorkflowRepository } from '../../domain/repositories/IWorkflowRepository';
import { AIWorkflow } from '@/types/workflow';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';

export class MongoWorkflowRepository implements IWorkflowRepository {
    async findActiveByTrigger(triggerType: string, tenantId: string): Promise<AIWorkflow[]> {
        const collection = await getTenantCollection<any>('ai_workflows', { user: { tenantId } });
        return await collection.find({
            active: true,
            'trigger.type': triggerType
        });
    }

    async getDefinition(tenantId: string, entityType: 'ENTITY' | 'EQUIPMENT' | 'USER' = 'ENTITY'): Promise<any> {
        const collection = await getTenantCollection<any>('workflow_definitions', { user: { tenantId } });
        return await collection.findOne({
            tenantId,
            entityType,
            active: true
        });
    }

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
