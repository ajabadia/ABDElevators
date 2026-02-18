import { AIWorkflow, WorkflowTriggerType } from '@/types/workflow';

export interface IAIWorkflowRepository {
    findActiveByTrigger(triggerType: WorkflowTriggerType, tenantId: string): Promise<AIWorkflow[]>;
    getDefinition(tenantId: string, entityType?: 'ENTITY' | 'EQUIPMENT' | 'USER'): Promise<any>;
}
