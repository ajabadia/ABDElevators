export interface ICaseWorkflowRepository {
    createTask(task: any): Promise<void>;
    updateEntity(entitySlug: string, id: any, updates: any, tenantId: string): Promise<void>;
}
