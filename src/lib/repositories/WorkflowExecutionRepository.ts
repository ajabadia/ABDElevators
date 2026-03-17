import { BaseRepository, type SafeFilter, type SafeUpdate } from './BaseRepository';
import { WorkflowExecutionSchema, type WorkflowExecution } from '@/lib/schemas/workflow-types';
import { type ClientSession, type Filter } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';
import { EntityId } from '@/lib/schemas/common';

/**
 * 🏛️ WorkflowExecutionRepository
 * Repositorio para el seguimiento de ejecuciones de workflows.
 * Track A: Procedural Visibility (Era 12).
 */
export class WorkflowExecutionRepository extends BaseRepository<WorkflowExecution> {
    constructor() {
        super('workflow_executions');
    }

    async findActiveByEntity(entityId: EntityId, session?: TenantSession | null): Promise<WorkflowExecution[]> {
        // Hardened validation (Isla 3)
        await this.validateExists('knowledge_assets', entityId, session);

        return await this.list({
            entityId,
            status: { $in: ['PENDING', 'RUNNING'] }
        }, { sort: { createdAt: -1 } }, session);
    }

    /**
     * Reemplaza create para asegurar integridad referencial.
     */
    async create(data: Omit<WorkflowExecution, '_id'>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<EntityId> {
        await Promise.all([
            this.validateExists('workflow_definitions', data.workflowDefinitionId, session, mongoSession),
            data.entityId ? this.validateExists('knowledge_assets', data.entityId, session, mongoSession) : Promise.resolve(),
            data.triggeredByUserId ? this.validateExists('users', data.triggeredByUserId, session, mongoSession) : Promise.resolve()
        ]);

        const validated = WorkflowExecutionSchema.parse(data);
        return await super.create(validated, session, mongoSession);
    }

    /**
     * Actualiza el estado de un nodo específico dentro de una ejecución.
     */
    async updateNodeStatus(
        executionId: EntityId,
        nodeId: string,
        status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED',
        updates: Record<string, unknown> = {},
        session?: TenantSession | null,
        mongoSession?: ClientSession
    ): Promise<boolean> {
        const collection = await this.getCollection(session);

        const setUpdate: Record<string, any> = {
            "nodes.$.status": status,
            "nodes.$.updatedAt": new Date(),
            ...Object.keys(updates).reduce((acc, key) => {
                acc[`nodes.$.${key}`] = updates[key];
                return acc;
            }, {} as Record<string, unknown>)
        };

        if (status === 'RUNNING') setUpdate["nodes.$.startedAt"] = new Date();
        if (status === 'COMPLETED' || status === 'FAILED') setUpdate["nodes.$.completedAt"] = new Date();

        const result = await collection.updateOne(
            { _id: this.toObjectId(executionId), "nodes.nodeId": nodeId },
            { $set: setUpdate },
            { session: mongoSession }
        );

        return result.matchedCount > 0;
    }

    /**
     * Registra una transición en el historial.
     */
    async logTransition(
        executionId: EntityId,
        fromState: string,
        toState: string,
        action?: string,
        session?: TenantSession | null,
        mongoSession?: ClientSession
    ): Promise<boolean> {
        const collection = await this.getCollection(session);
        const userId = session?.user?.id;

        return await this.update(executionId, {
            $set: { currentState: toState, updatedAt: new Date() },
            $push: {
                history: {
                    fromState,
                    toState,
                    action,
                    performedBy: userId,
                    timestamp: new Date()
                }
            }
        }, session, mongoSession);
    }
}

export const workflowExecutionRepository = new WorkflowExecutionRepository();
