import { workflowDefinitionRepository } from '@/lib/repositories/WorkflowDefinitionRepository';
import { WorkflowDefinitionSchema, type WorkflowDefinition } from '@/lib/schemas';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { type ClientSession, ObjectId } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';
import { IndustryType } from '@/lib/schemas';

/**
 * Servicio de Gestión de Workflows (Era 8 Hardened)
 * Permite a los administradores configurar sus propios procesos.
 */
export class WorkflowService {
    /**
     * Crea o actualiza una definición de workflow.
     */
    static async createOrUpdateDefinition(
        definition: Partial<WorkflowDefinition>,
        correlationId: string,
        session?: TenantSession | null,
        mongoSession?: ClientSession
    ): Promise<string> {
        const validated = WorkflowDefinitionSchema.parse(definition);
        const environment = validated.environment || 'PRODUCTION';

        // Workflow atomic update with session support
        const runWithTransaction = async (s: ClientSession) => {
            // Solo un workflow por tipo de entidad puede ser default
            if (validated.is_default) {
                await workflowDefinitionRepository.unsetDefaults(validated.entityType, session, s);
            }

            const query = {
                tenantId: validated.tenantId,
                entityType: validated.entityType,
                name: validated.name,
                environment
            };

            const repo = workflowDefinitionRepository as unknown as {
                getCollection: (s: TenantSession | null | undefined) => Promise<{
                    updateOne: (query: any, update: any, options: any) => Promise<{ upsertedId?: { toString: () => string } }>
                }>
            };
            const collection = await repo.getCollection(session);
            const result = await collection.updateOne(
                query,
                { $set: { ...validated, updatedAt: new Date() } },
                { upsert: true, session: s }
            );

            return result.upsertedId?.toString() || 'updated';
        };

        let resultId: string;
        if (mongoSession) {
            resultId = await runWithTransaction(mongoSession);
        } else {
            const { connectDB } = await import('@/lib/db');
            const db = await connectDB();
            const client = (db as unknown as { client: import('mongodb').MongoClient }).client;
            const s = client.startSession();
            try {
                resultId = await s.withTransaction(async () => await runWithTransaction(s));
            } finally {
                await s.endSession();
            }
        }

        await logEvento({
            level: 'INFO',
            source: 'WORKFLOW_SERVICE',
            action: 'UPSERT_DEFINITION',
            message: `Workflow '${validated.name}' actualizado para tenant ${validated.tenantId} en ${environment}`,
            correlationId,
            details: { name: validated.name, entity_type: validated.entityType, environment }
        });

        return resultId;
    }

    /**
     * Lista todas las definiciones para un tenant y tipo.
     */
    static async listDefinitions(options: {
        tenantId: string,
        entityType?: 'ENTITY' | 'EQUIPMENT' | 'USER',
        environment?: string,
        limit?: number,
        after?: string | null
    }, session?: TenantSession | null): Promise<WorkflowDefinition[] & { nextCursor?: string | null }> {
        const { tenantId, entityType = 'ENTITY', environment = 'PRODUCTION', limit = 100, after = null } = options;

        const filter: Record<string, unknown> = { tenantId, entityType, environment };
        if (after) {
            filter._id = { $lt: workflowDefinitionRepository.toObjectId(after) };
        }

        const docs = await workflowDefinitionRepository.list(filter, {
            sort: { _id: -1 },
            limit: limit + 1
        }, session);

        const items = docs.slice(0, limit) as unknown as WorkflowDefinition[] & { nextCursor?: string | null };
        const hasNextPage = docs.length > limit;
        items.nextCursor = hasNextPage ? (docs[limit - 1] as unknown as { _id: ObjectId })._id.toString() : null;

        return items;
    }

    /**
     * Obtiene el workflow activo para una entidad.
     */
    static async getActiveWorkflow(tenantId: string, entityType: 'ENTITY' | 'EQUIPMENT' | 'USER' = 'ENTITY', environment: string = 'PRODUCTION', session?: TenantSession | null) {
        return await workflowDefinitionRepository.findOne({ tenantId, entityType, active: true, environment } as Record<string, unknown>, session);
    }

    /**
     * Obtiene una definición por ID.
     */
    static async getDefinitionById(id: string, session?: TenantSession | null) {
        return await workflowDefinitionRepository.findById(id, session);
    }

    /**
     * Inicializa un workflow por defecto para un nuevo Tenant (Seeding).
     */
    static async seedDefaultWorkflow(tenantId: string, industry: string, correlationId: string, session?: TenantSession | null) {
        const defaultWorkflow: Partial<WorkflowDefinition> = {
            tenantId,
            industry: industry as IndustryType,
            name: 'Flujo Estándar',
            entityType: 'ENTITY',
            is_default: true,
            active: true,
            environment: 'PRODUCTION',
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

        return await this.createOrUpdateDefinition(defaultWorkflow, correlationId, session);
    }
}
