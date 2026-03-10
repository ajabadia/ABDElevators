import { BaseRepository } from './BaseRepository';
import { WorkflowDefinitionSchema, type WorkflowDefinition } from '@/lib/schemas';
import { type ClientSession } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';

/**
 * 🏛️ WorkflowDefinitionRepository
 * Repositorio centralizado para definiciones de workflow.
 * Hardened Era 8: Strict types and transaction support.
 */
export class WorkflowDefinitionRepository extends BaseRepository<WorkflowDefinition> {
    constructor() {
        super('workflow_definitions');
    }

    /**
     * Busca el workflow por defecto para un tipo de entidad.
     */
    async findDefault(entityType: string, session?: TenantSession | null, mongoSession?: ClientSession): Promise<WorkflowDefinition | null> {
        const collection = await this.getCollection(session);
        return await collection.findOne({ entityType, is_default: true } as any, { session: mongoSession }) as WorkflowDefinition | null;
    }

    /**
     * Desactiva el flag 'is_default' para todos los workflows de un tipo de entidad.
     */
    async unsetDefaults(entityType: string, session?: TenantSession | null, mongoSession?: ClientSession): Promise<void> {
        const collection = await this.getCollection(session);
        await collection.updateMany(
            { entityType, is_default: true } as any,
            { $set: { is_default: false, updatedAt: new Date() } },
            { session: mongoSession }
        );
    }
}

export const workflowDefinitionRepository = new WorkflowDefinitionRepository();
