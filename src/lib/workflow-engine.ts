import { getTenantCollection } from './db-tenant';
import { AppError, ValidationError, NotFoundError } from './errors';
import { WorkflowDefinition, GenericCase, IndustryType } from './schemas';
import { ObjectId } from 'mongodb';
import { logEvento } from './logger';
import { NotificationService } from './notification-service';

export interface TransitionRequest {
    caseId: string;
    toState: string; // ID del estado destino
    role: string;
    correlacion_id: string;
    comment?: string;
    signature?: string;
}

/**
 * Motor de Workflows Avanzado (Visión 2.0 - Fase 7.2)
 * Orquestador dinámico de transiciones de estado multi-tenant.
 */
export class WorkflowEngine {
    /**
     * Obtiene la definición de workflow activa para un tenant y tipo de entidad.
     */
    static async getDefinition(tenantId: string, entity_type: 'PEDIDO' | 'EQUIPO' | 'USUARIO' = 'PEDIDO') {
        const { collection } = await getTenantCollection('workflow_definitions');
        return await collection.findOne({
            tenantId,
            entity_type,
            active: true
        }) as WorkflowDefinition | null;
    }

    /**
     * Ejecuta una transición de estado validando condiciones y disparando acciones.
     */
    static async executeTransition(request: TransitionRequest) {
        const { caseId, toState, role, correlacion_id, comment, signature } = request;

        const { collection: casesCollection, tenantId } = await getTenantCollection('casos');
        const definition = await this.getDefinition(tenantId);

        if (!definition) {
            throw new AppError('NOT_FOUND', 404, `No se encontró definición de workflow activa para el tenant ${tenantId}`);
        }

        const caso = await casesCollection.findOne({
            _id: new ObjectId(caseId),
            tenantId
        }) as any;

        if (!caso) {
            throw new NotFoundError('Caso/Pedido no encontrado');
        }

        // 1. Identificar la transición válida
        const transition = definition.transitions.find(t => t.from === caso.status && t.to === toState);

        if (!transition) {
            throw new ValidationError(`Transición de '${caso.status}' a '${toState}' no está permitida en este workflow.`);
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

            if (checklist_complete && caso.metadata?.checklist_status !== 'COMPLETED') {
                throw new ValidationError('No se puede avanzar: el checklist debe estar completado.');
            }

            if (min_documents && (caso.documentos?.length || 0) < min_documents) {
                throw new ValidationError(`Se requieren al menos ${min_documents} documentos adjuntos.`);
            }

            if (require_comment && !comment) {
                throw new ValidationError('Esta transición requiere un comentario justificativo.');
            }

            if (require_signature && !signature) {
                throw new ValidationError('Esta transición requiere firma digital.');
            }
        }

        // 5. Preparar actualización
        const updateData: any = {
            status: toState,
            actualizado: new Date(),
        };

        const logEntry = {
            from: caso.status,
            to: toState,
            role,
            comment,
            signature,
            timestamp: new Date(),
            correlacion_id
        };

        // Mantener historial de transiciones
        await casesCollection.updateOne(
            { _id: new ObjectId(caseId) },
            {
                $set: updateData,
                $push: { transitions_history: logEntry }
            } as any
        );

        // 6. Disparar Acciones Automáticas (Placeholder para lógica futura)
        if (transition.actions && transition.actions.length > 0) {
            await this.handleActions(transition.actions, caso, correlacion_id);
        }

        await logEvento({
            nivel: 'INFO',
            origen: 'WORKFLOW_ENGINE',
            accion: 'STATE_TRANSITION',
            mensaje: `Pedido ${caseId} movido a ${toState} por ${role}`,
            correlacion_id,
            detalles: { caseId, from: caso.status, to: toState, role }
        });

        return { success: true, to: toState };
    }

    /**
     * Orquestador de acciones secundarias (Visión 2.0 - Fase 7.2)
     */
    private static async handleActions(actions: string[], caso: any, correlacion_id: string) {
        for (const action of actions) {
            await logEvento({
                nivel: 'DEBUG',
                origen: 'WORKFLOW_ENGINE',
                accion: 'TRIGGER_ACTION',
                mensaje: `Disparando acción automática: ${action}`,
                correlacion_id,
                detalles: { caseId: caso._id, action }
            });

            try {
                if (action === 'notify_admin') {
                    await NotificationService.notify({
                        tenantId: caso.tenantId,
                        type: 'SYSTEM',
                        level: 'INFO',
                        title: 'Actualización de Pedido',
                        message: `El pedido ${caso.numero_pedido || caso._id} ha cambiado de estado a: ${caso.status}`,
                        link: `/pedidos/${caso._id}`,
                        metadata: { caseId: caso._id, status: caso.status }
                    });
                }

                if (action === 'notify_user' && caso.userId) {
                    await NotificationService.notify({
                        tenantId: caso.tenantId,
                        userId: caso.userId,
                        type: 'SYSTEM',
                        level: 'SUCCESS',
                        title: 'Tu pedido ha avanzado',
                        message: `Tu pedido ${caso.numero_pedido || caso._id} ahora está en: ${caso.status}`,
                        link: `/pedidos/${caso._id}`,
                        metadata: { caseId: caso._id, status: caso.status }
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
