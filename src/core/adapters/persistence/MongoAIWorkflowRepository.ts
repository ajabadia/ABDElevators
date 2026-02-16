import { IAIWorkflowRepository } from '../../domain/repositories/IAIWorkflowRepository';
import { AIWorkflow } from '@/types/workflow';
import { getTenantCollection } from '@/lib/db-tenant';

export class MongoAIWorkflowRepository implements IAIWorkflowRepository {
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
}
