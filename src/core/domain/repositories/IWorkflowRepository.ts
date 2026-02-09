import { AIWorkflow } from '@/types/workflow';

export interface IWorkflowRepository {
    findActiveByTrigger(triggerType: string, tenantId: string): Promise<AIWorkflow[]>;
    getDefinition(tenantId: string, entityType?: 'ENTITY' | 'EQUIPMENT' | 'USER'): Promise<any>;
    createTask(task: any): Promise<void>;
    updateEntity(entitySlug: string, id: any, updates: any, tenantId: string): Promise<void>;
}
