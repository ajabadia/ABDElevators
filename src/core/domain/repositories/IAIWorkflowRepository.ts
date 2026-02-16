import { AIWorkflow } from '@/types/workflow';

export interface IAIWorkflowRepository {
    findActiveByTrigger(triggerType: string, tenantId: string): Promise<AIWorkflow[]>;
    getDefinition(tenantId: string, entityType?: 'ENTITY' | 'EQUIPMENT' | 'USER'): Promise<any>;
}
