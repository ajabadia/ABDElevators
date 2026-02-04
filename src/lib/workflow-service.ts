import { getTenantCollection } from './db-tenant';
import { WorkflowDefinitionSchema, WorkflowDefinition } from '@/lib/schemas';
import { AppError, ValidationError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';

/**
 * Servicio de Gestión de Workflows (Fase 7.2)
 * Permite a los administradores configurar sus propios procesos.
 */
export class WorkflowService {
    /**
     * Crea o actualiza una definición de workflow.
     */
    /**
     * Crea o actualiza una definición de workflow.
     */
    static async createOrUpdateDefinition(definition: Partial<WorkflowDefinition>, correlationId: string) {
        const validated = WorkflowDefinitionSchema.parse(definition);
        const collection = await getTenantCollection('workflow_definitions');
        const tenantId = collection.tenantId;
        const environment = validated.environment;

        // Solo un workflow por tipo de entidad puede ser default
        if (validated.is_default) {
            await collection.updateMany(
                { tenantId, entityType: validated.entityType, environment },
                { $set: { is_default: false } }
            );
        }

        const query = {
            tenantId,
            entityType: validated.entityType,
            name: validated.name,
            environment
        };

        const result = await collection.updateOne(
            query,
            { $set: { ...validated, updatedAt: new Date() } },
            { upsert: true }
        );

        await logEvento({
            level: 'INFO',
            source: 'WORKFLOW_SERVICE',
            action: 'UPSERT_DEFINITION',
            message: `Workflow '${validated.name}' actualizado para tenant ${tenantId} en ${environment}`, correlationId,
            details: { name: validated.name, entity_type: validated.entityType, environment }
        });

        return result.upsertedId || result.matchedCount;
    }

    /**
     * Lista todas las definiciones para un tenant y tipo.
     */
    static async listDefinitions(
        optionsOrTenantId: { tenantId?: string, entityType?: 'ENTITY' | 'EQUIPMENT' | 'USER', environment?: string, limit?: number, after?: string | null } | string,
        legacyEntityType: 'ENTITY' | 'EQUIPMENT' | 'USER' = 'ENTITY',
        legacyEnvironment: string = 'PRODUCTION'
    ): Promise<WorkflowDefinition[] & { nextCursor?: string | null }> {
        let tenantId: string;
        let entityType = legacyEntityType;
        let environment = legacyEnvironment;
        let limit = 100;
        let after: string | null = null;

        if (typeof optionsOrTenantId === 'object' && optionsOrTenantId !== null && !Array.isArray(optionsOrTenantId)) {
            const opts = optionsOrTenantId as any;
            tenantId = opts.tenantId;
            entityType = opts.entityType ?? 'ENTITY';
            environment = opts.environment ?? 'PRODUCTION';
            limit = opts.limit ?? 100;
            after = opts.after ?? null;
        } else {
            tenantId = optionsOrTenantId as string;
        }

        const collection = await getTenantCollection('workflow_definitions');
        const filter: any = { tenantId, entityType, environment };

        if (after) {
            filter._id = { $lt: new ObjectId(after) };
        }

        const docs = await collection.find(filter, {
            sort: { _id: -1 },
            limit: limit + 1
        });

        const items = docs.slice(0, limit) as unknown as WorkflowDefinition[] & { nextCursor?: string | null };
        const hasNextPage = docs.length > limit;
        items.nextCursor = hasNextPage ? ((docs[limit - 1] as any)._id.toString()) : null;

        return items;
    }

    /**
     * Obtiene el workflow activo para una entidad.
     */
    static async getActiveWorkflow(tenantId: string, entityType: 'ENTITY' | 'EQUIPMENT' | 'USER' = 'ENTITY', environment: string = 'PRODUCTION') {
        const collection = await getTenantCollection('workflow_definitions');
        return await collection.findOne({ tenantId, entityType, active: true, environment }) as WorkflowDefinition | null;
    }

    /**
     * Inicializa un workflow por defecto para un nuevo Tenant (Seeding).
     */
    static async seedDefaultWorkflow(tenantId: string, industry: any, correlationId: string) {
        const defaultWorkflow: Partial<WorkflowDefinition> = {
            tenantId,
            industry,
            name: 'Flujo Estándar',
            entityType: 'ENTITY',
            is_default: true,
            active: true,
            environment: 'PRODUCTION', // Default for seeding
            initial_state: 'ingresado',
            states: [
                { id: 'ingresado', label: 'Ingresado', color: '#64748b', icon: 'FileText', can_edit: true, is_initial: true, is_final: false, requires_validation: false, roles_allowed: ['ADMIN', 'TECHNICAL', 'ENGINEERING'] },
                { id: 'analizando', label: 'Analizando', color: '#0d9488', icon: 'Search', can_edit: true, is_initial: false, is_final: false, requires_validation: false, roles_allowed: ['TECHNICAL', 'ENGINEERING'] },
                { id: 'revision', label: 'En Revisión', color: '#d97706', icon: 'Eye', can_edit: false, is_initial: false, is_final: false, requires_validation: true, roles_allowed: ['ADMIN', 'ENGINEERING'] },
                { id: 'completado', label: 'Completado', color: '#16a34a', icon: 'CheckCircle', can_edit: false, is_initial: false, is_final: true, requires_validation: false, roles_allowed: ['ADMIN', 'TECHNICAL', 'ENGINEERING'] }
            ],
            transitions: [
                { from: 'ingresado', to: 'analizando', label: 'Iniciar Análisis', required_role: ['TECHNICAL', 'ENGINEERING'] },
                { from: 'analizando', to: 'revision', label: 'Enviar a Revisión', conditions: { checklist_complete: true, min_documents: 0, require_signature: false, require_comment: false } },
                { from: 'revision', to: 'completado', label: 'Aprobar Informe', required_role: ['ADMIN', 'REVIEWER'], conditions: { checklist_complete: false, min_documents: 0, require_signature: true, require_comment: true } },
                { from: 'revision', to: 'analizando', label: 'Solicitar Correcciones', action: 'REJECT', required_role: ['COMPLIANCE'] }
            ]
        };

        return await this.createOrUpdateDefinition(defaultWorkflow, correlationId);
    }
}
