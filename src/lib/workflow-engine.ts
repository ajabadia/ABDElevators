import { getTenantCollection } from './db-tenant';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import { WorkflowDefinition, GenericCase, IndustryType } from '@/lib/schemas';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { NotificationService } from './notification-service';

export interface TransitionRequest {
    caseId: string;
    toState: string; // ID of target state
    role: string;
    correlationId: string;
    comment?: string;
    signature?: string;

    // Suite Features (Dynamic Domain)
    collectionName?: string; // e.g. 'cases', 'equipment', 'incidents'
    entityLinkTemplate?: string; // e.g. '/admin/cases/${id}'
}

/**
 * Motor de Workflows de Casos (CaseWorkflowEngine)
 * Orquestador dinámico de transiciones de estado multi-tenant.
 */
export class CaseWorkflowEngine {
    /**
     * Gets the active workflow definition for a tenant and entity type.
     */
    static async getDefinition(tenantId: string, entityType: string = 'ENTITY') {
        const collection = await getTenantCollection('workflow_definitions');
        return await collection.findOne({
            tenantId,
            entityType,
            active: true
        }) as WorkflowDefinition | null;
    }

    /**
     * Executes a state transition validating conditions and triggering actions.
     */
    static async executeTransition(request: TransitionRequest) {
        const {
            caseId,
            toState,
            role,
            correlationId,
            comment,
            signature,
            collectionName = 'cases',
            entityLinkTemplate = '/admin/cases/${id}'
        } = request;

        const entityCollection = await getTenantCollection(collectionName as any);
        const tenantId = entityCollection.tenantId;
        const definition = await this.getDefinition(tenantId);

        if (!definition) {
            throw new AppError('NOT_FOUND', 404, `No se encontró definición de workflow activa para el tenant ${tenantId}`);
        }

        const entity = await entityCollection.findOne({
            _id: new ObjectId(caseId)
        }) as any;

        if (!entity) {
            throw new NotFoundError('Entidad no encontrada');
        }

        // 1. Identificar la transición válida
        const transition = definition.transitions.find(t => t.from === entity.status && t.to === toState);

        if (!transition) {
            throw new ValidationError(`Transición de '${entity.status}' a '${toState}' no está permitida en este workflow.`);
        }

        // 2. Verificar permisos por rol (Transición)
        if (transition.required_role && !transition.required_role.includes(role)) {
            throw new AppError('UNAUTHORIZED', 403, `Tu rol (${role}) no está autorizado para realizar esta transición.`);
        }

        // 3. Verificar permisos del Estado Destino
        const nextState = definition.states.find(s => s.id === toState);
        if (nextState && !nextState.roles_allowed.includes(role)) {
            throw new AppError('UNAUTHORIZED', 403, `Tu rol (${role}) no tiene permisos para acceder al estado '${nextState.label}'.`);
        }

        // 4. Validar Condiciones Dinámicas
        if (transition.conditions) {
            const { checklist_complete, min_documents, require_comment, require_signature } = transition.conditions;

            if (checklist_complete && entity.metadata?.checklist_status !== 'COMPLETED') {
                throw new ValidationError('No se puede avanzar: el checklist debe estar completado.');
            }

            if (min_documents && (entity.documentos?.length || 0) < min_documents) {
                throw new ValidationError(`Se requieren al menos ${min_documents} documentos adjuntos.`);
            }

            if (require_comment && !comment) {
                throw new ValidationError('Esta transición requiere un comentario justificativo.');
            }

            if (require_signature && !signature) {
                throw new ValidationError('Esta transición requiere firma digital.');
            }
        }

        // 5. Prepare update
        const updateData: any = {
            status: toState,
            updatedAt: new Date(),
        };

        const logEntry = {
            from: entity.status,
            to: toState,
            role,
            comment,
            signature,
            timestamp: new Date(),
            correlationId
        };

        // Mantener historial de transiciones
        await entityCollection.updateOne(
            { _id: new ObjectId(caseId) },
            {
                $set: updateData,
                $push: { transitions_history: logEntry }
            } as any
        );

        // 6. Generar Tareas Automáticas (WorkflowTasks) basadas en el estado
        if (nextState?.requires_validation) {
            const tasksCollection = await getTenantCollection('workflow_tasks');
            await tasksCollection.insertOne({
                tenantId,
                caseId: String(entity._id),
                type: 'DOCUMENT_REVIEW',
                title: `Revisión requerida para estado: ${nextState.label}`,
                description: `El caso ha avanzado a ${nextState.label} y requiere validación formal.`,
                assignedRole: nextState.roles_allowed.includes('COMPLIANCE') ? 'COMPLIANCE' : 'REVIEWER',
                status: 'PENDING',
                priority: 'MEDIUM',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await logEvento({
                level: 'INFO',
                source: 'WORKFLOW_ENGINE',
                action: 'TASK_GENERATED',
                message: `WorkflowTask generated for ${caseId} in state ${toState}`,
                correlationId,
                details: { caseId, assignedRole: nextState.roles_allowed[0] }
            });
        }

        // 7. Disparar Acciones Automáticas (Secondary Actions)
        if (transition.actions && transition.actions.length > 0) {
            await this.handleActions(transition.actions, entity, correlationId, entityLinkTemplate);
        }

        await logEvento({
            level: 'INFO',
            source: 'WORKFLOW_ENGINE',
            action: 'STATE_TRANSITION',
            message: `Entity ${caseId} moved to ${toState} by ${role}`,
            correlationId,
            details: { caseId, from: entity.status, to: toState, role }
        });

        return { success: true, to: toState };
    }

    /**
     * Orquestador de acciones secundarias (Visión 2.0 - Fase 7.2)
     */
    private static async handleActions(actions: string[], entity: any, correlationId: string, linkTemplate: string) {
        for (const action of actions) {
            const dynamicLink = linkTemplate.replace('${id}', entity._id.toString());
            await logEvento({
                level: 'DEBUG',
                source: 'WORKFLOW_ENGINE',
                action: 'TRIGGER_ACTION',
                message: `Triggering automatic action: ${action}`,
                correlationId,
                details: { caseId: entity._id, action }
            });

            try {
                if (action === 'notify_admin') {
                    await NotificationService.notify({
                        tenantId: entity.tenantId,
                        type: 'SYSTEM',
                        level: 'INFO',
                        title: 'Entity Update',
                        message: `The entity ${entity.identifier || entity._id} has changed state to: ${entity.status}`,
                        link: dynamicLink,
                        metadata: { caseId: entity._id, status: entity.status }
                    });
                }

                if (action === 'notify_user' && entity.userId) {
                    await NotificationService.notify({
                        tenantId: entity.tenantId,
                        userId: entity.userId,
                        type: 'SYSTEM',
                        level: 'SUCCESS',
                        title: 'Your entity has advanced',
                        message: `Your entity ${entity.identifier || entity._id} is now in: ${entity.status}`,
                        link: dynamicLink,
                        metadata: { caseId: entity._id, status: entity.status }
                    });
                }

                if (action === 'log_audit') {
                    // Acción redundante si ya logueamos en executeTransition, 
                    // pero útil para auditorías externas en Phase 24.
                }
            } catch (error) {
                console.error(`[WorkflowEngine] Error executing action ${action}:`, error);
                // No lanzamos error para no bloquear la transición principal
            }
        }
    }
}

export const LegacyCaseWorkflowEngine = CaseWorkflowEngine; 
