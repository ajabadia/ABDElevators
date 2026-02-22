import type { WorkflowTask } from '@abd/workflow-engine';

export interface ICaseWorkflowRepository {
    createTask(task: WorkflowTask | any): Promise<void>; // Allowing any for transition but prefer WorkflowTask
    updateEntity(entitySlug: string, id: any, updates: any, tenantId: string): Promise<void>;
}
