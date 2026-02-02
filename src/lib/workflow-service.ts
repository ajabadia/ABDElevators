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
    static async listDefinitions(tenantId: string, entityType: 'ENTITY' | 'EQUIPMENT' | 'USER' = 'ENTITY', environment: string = 'PRODUCTION') {
        const collection = await getTenantCollection('workflow_definitions');
        return await collection.find({ tenantId, entityType, environment }, { sort: { updatedAt: -1 } }) as WorkflowDefinition[];
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
                { id: 'ingresado', label: 'Ingresado', color: '#64748b', icon: 'FileText', can_edit: true, is_initial: true, is_final: false, requires_validation: false, roles_allowed: ['ADMIN', 'TECNICO', 'INGENIERIA'] },
                { id: 'analizando', label: 'Analizando', color: '#0d9488', icon: 'Search', can_edit: true, is_initial: false, is_final: false, requires_validation: false, roles_allowed: ['TECNICO', 'INGENIERIA'] },
                { id: 'revision', label: 'En Revisión', color: '#d97706', icon: 'Eye', can_edit: false, is_initial: false, is_final: false, requires_validation: true, roles_allowed: ['ADMIN', 'INGENIERIA'] },
                { id: 'completado', label: 'Completado', color: '#16a34a', icon: 'CheckCircle', can_edit: false, is_initial: false, is_final: true, requires_validation: false, roles_allowed: ['ADMIN', 'TECNICO', 'INGENIERIA'] }
            ],
            transitions: [
                { from: 'ingresado', to: 'analizando', label: 'Iniciar Análisis', required_role: ['TECNICO', 'INGENIERIA'] },
                { from: 'analizando', to: 'revision', label: 'Enviar a Revisión', conditions: { checklist_complete: true, min_documents: 0, require_signature: false, require_comment: false } },
                { from: 'revision', to: 'completado', label: 'Aprobar Informe', required_role: ['ADMIN'], conditions: { checklist_complete: false, min_documents: 0, require_signature: true, require_comment: true } },
                { from: 'revision', to: 'analizando', label: 'Solicitar Correcciones', action: 'REJECT' }
            ]
        };

        return await this.createOrUpdateDefinition(defaultWorkflow, correlationId);
    }
}
