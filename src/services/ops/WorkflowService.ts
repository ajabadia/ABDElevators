import { workflowDefinitionRepository } from '@/lib/repositories/WorkflowDefinitionRepository';
import { WorkflowDefinitionSchema, type WorkflowDefinition } from '@/lib/schemas';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { type ClientSession, ObjectId } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';
import { IndustryType } from '@/lib/schemas';

/**
 * Workflow Management Service (Era 8 Hardened)
 * Allows administrators to configure their own processes.
 */
export class WorkflowService {
    /**
     * Creates or updates a workflow definition.
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
            // Only one workflow per entity type can be default
            if (validated.is_default) {
                await workflowDefinitionRepository.unsetDefaults(validated.entityType, session, s);
            }

            const query = {
                tenantId: validated.tenantId,
                entityType: validated.entityType,
                name: validated.name,
                environment
            };

            const result = await workflowDefinitionRepository.updateOne(
                query as any,
                { $set: { ...validated, updatedAt: new Date() } },
                session,
                s,
                { upsert: true }
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
            message: `Workflow '${validated.name}' updated for tenant ${validated.tenantId} in ${environment}`,
            correlationId,
            details: { name: validated.name, entity_type: validated.entityType, environment }
        });

        return resultId;
    }

    /**
     * Lists all definitions for a tenant and entity type.
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
     * Gets the active workflow for an entity.
     */
    static async getActiveWorkflow(tenantId: string, entityType: 'ENTITY' | 'EQUIPMENT' | 'USER' = 'ENTITY', environment: string = 'PRODUCTION', session?: TenantSession | null) {
        return await workflowDefinitionRepository.findOne({ tenantId, entityType, active: true, environment } as Record<string, unknown>, session);
    }

    /**
     * Gets a definition by ID.
     */
    static async getDefinitionById(id: string, session?: TenantSession | null) {
        return await workflowDefinitionRepository.findById(id, session);
    }

    /**
     * Initializes a default workflow for a new Tenant (Seeding).
     */
    static async seedDefaultWorkflow(tenantId: string, industry: string, correlationId: string, session?: TenantSession | null) {
        const defaultWorkflow: Partial<WorkflowDefinition> = {
            tenantId,
            industry: industry as IndustryType,
            name: 'Standard Flow',
            entityType: 'ENTITY',
            is_default: true,
            active: true,
            environment: 'PRODUCTION',
            initial_state: 'entered',
            states: [
                { id: 'entered', label: 'Entered', color: '#64748b', icon: 'FileText', can_edit: true, is_initial: true, is_final: false, requires_validation: false, roles_allowed: ['ADMIN', 'TECHNICAL', 'ENGINEERING'] },
                { id: 'analyzing', label: 'Analyzing', color: '#0d9488', icon: 'Search', can_edit: true, is_initial: false, is_final: false, requires_validation: false, roles_allowed: ['TECHNICAL', 'ENGINEERING'] },
                { id: 'review', label: 'Under Review', color: '#d97706', icon: 'Eye', can_edit: false, is_initial: false, is_final: false, requires_validation: true, roles_allowed: ['ADMIN', 'ENGINEERING'] },
                { id: 'completed', label: 'Completed', color: '#16a34a', icon: 'CheckCircle', can_edit: false, is_initial: false, is_final: true, requires_validation: false, roles_allowed: ['ADMIN', 'TECHNICAL', 'ENGINEERING'] }
            ],
            transitions: [
                { from: 'entered', to: 'analyzing', label: 'Start Analysis', required_role: ['TECHNICAL', 'ENGINEERING'] },
                { from: 'analyzing', to: 'review', label: 'Send to Review', conditions: { checklist_complete: true, min_documents: 0, require_signature: false, require_comment: false } },
                { from: 'review', to: 'completed', label: 'Approve Report', required_role: ['ADMIN', 'REVIEWER'], conditions: { checklist_complete: false, min_documents: 0, require_signature: true, require_comment: true } },
                { from: 'review', to: 'analyzing', label: 'Request Corrections', action: 'REJECT', required_role: ['COMPLIANCE'] }
            ]
        };

        return await this.createOrUpdateDefinition(defaultWorkflow, correlationId, session);
    }
}
