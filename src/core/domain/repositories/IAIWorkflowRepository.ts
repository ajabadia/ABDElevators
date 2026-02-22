import type { AIWorkflow, WorkflowTriggerType } from '@abd/workflow-engine';

export interface IAIWorkflowRepository {
    findActiveByTrigger(triggerType: WorkflowTriggerType, tenantId: string): Promise<AIWorkflow[]>;
    getDefinition(tenantId: string, entityType?: 'ENTITY' | 'EQUIPMENT' | 'USER'): Promise<any>;
}
