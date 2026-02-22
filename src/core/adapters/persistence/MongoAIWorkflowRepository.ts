import { IAIWorkflowRepository } from '../../domain/repositories/IAIWorkflowRepository';
import type { AIWorkflow, WorkflowTriggerType } from '@abd/workflow-engine';
import { getTenantCollection } from '@/lib/db-tenant';

export class MongoAIWorkflowRepository implements IAIWorkflowRepository {
    async findActiveByTrigger(triggerType: WorkflowTriggerType, tenantId: string): Promise<AIWorkflow[]> {
        const collection = await getTenantCollection<any>('ai_workflows', { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any);
        return await collection.find({
            active: true,
            'trigger.type': triggerType
        });
    }

    async getDefinition(tenantId: string, entityType: 'ENTITY' | 'EQUIPMENT' | 'USER' = 'ENTITY'): Promise<any> {
        const collection = await getTenantCollection<any>('workflow_definitions', { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any);
        return await collection.findOne({
            tenantId,
            entityType,
            active: true
        });
    }
}
