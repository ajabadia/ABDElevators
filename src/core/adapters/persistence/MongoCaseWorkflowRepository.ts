import { ICaseWorkflowRepository } from '../../domain/repositories/ICaseWorkflowRepository';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';
import type { WorkflowTask } from '@abd/workflow-engine';
import { logEvento } from '@/lib/logger';

export class MongoCaseWorkflowRepository implements ICaseWorkflowRepository {
    async createTask(task: WorkflowTask): Promise<void> {
        const collection = await getTenantCollection<any>('workflow_tasks', { user: { id: 'system', tenantId: task.tenantId, role: 'SYSTEM' } } as any);
        const result = await collection.insertOne({
            ...task,
            _id: task._id ? new ObjectId(task._id) : new ObjectId(),
            status: task.status || 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await logEvento({
            level: 'INFO',
            source: 'MONGO_CASE_WORKFLOW_REPO',
            action: 'TASK_CREATED',
            message: `Task created: ${task.title}`,
            tenantId: task.tenantId,
            details: { taskId: result.insertedId.toString(), type: task.type },
            correlationId: task.metadata?.correlationId || 'system'
        });
    }

    async updateEntity(entitySlug: string, id: any, updates: any, tenantId: string): Promise<void> {
        const collection = await getTenantCollection<any>(entitySlug, { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any);
        const filter = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
        await collection.updateOne(filter as any, {
            $set: {
                ...updates,
                updatedAt: new Date()
            }
        });
    }
}
