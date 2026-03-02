import { BaseRepository } from './BaseRepository';
import { WorkflowTaskSchema, type WorkflowTask } from '@/lib/schemas';
import { type ClientSession, type Filter } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';

/**
 * 🏛️ WorkflowTaskRepository
 * Repositorio centralizado para tareas de workflow.
 * Hardened Era 8: Strict types and transaction support.
 */
export class WorkflowTaskRepository extends BaseRepository<WorkflowTask> {
    protected readonly collectionName = 'workflow_tasks';

    /**
     * Lista tareas con filtros específicos de dominio.
     */
    async listTasks(filter: Filter<WorkflowTask>, session?: TenantSession | null, mongoSession?: ClientSession) {
        return await this.list(filter, { sort: { priority: -1, createdAt: -1 } }, session, mongoSession);
    }
}

export const workflowTaskRepository = new WorkflowTaskRepository();
