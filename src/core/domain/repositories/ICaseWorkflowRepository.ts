import { WorkflowTask } from '@/lib/schemas/workflow-task';

export interface ICaseWorkflowRepository {
    createTask(task: WorkflowTask | any): Promise<void>; // Allowing any for transition but prefer WorkflowTask
    updateEntity(entitySlug: string, id: any, updates: any, tenantId: string): Promise<void>;
}
