import { IAIWorkflowRepository } from '../../domain/repositories/IAIWorkflowRepository';
import type { AIWorkflow, WorkflowTriggerType } from '@abd/workflow-engine';
import { getTenantCollection } from '@/lib/db-tenant';
import { type TenantSession } from '@/lib/db-tenant';

export class MongoAIWorkflowRepository implements IAIWorkflowRepository {
    private async getSystemSession(tenantId: string): Promise<TenantSession> {
        return { user: { id: 'system', tenantId, role: 'SYSTEM' } } as unknown as TenantSession;
    }

    async findActiveByTrigger(triggerType: WorkflowTriggerType, tenantId: string): Promise<AIWorkflow[]> {
        const session = await this.getSystemSession(tenantId);
        const collection = await getTenantCollection<AIWorkflow>('ai_workflows', session, 'MAIN');
        return await collection.find({
            active: true,
            'trigger.type': triggerType
        }).toArray();
    }

    async getDefinition(tenantId: string, entityType: 'ENTITY' | 'EQUIPMENT' | 'USER' = 'ENTITY'): Promise<AIWorkflow | null> {
        const session = await this.getSystemSession(tenantId);
        const collection = await getTenantCollection<AIWorkflow>('workflow_definitions', session, 'MAIN');
        return await collection.findOne({
            tenantId,
            entityType,
            active: true
        });
    }
}
