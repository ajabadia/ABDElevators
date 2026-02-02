
import { logEvento } from '@/lib/logger';
import { getTenantCollection } from '@/lib/db-tenant';
import { GovernanceEngine } from './GovernanceEngine';
import { AIWorkflow, WorkflowAction, WorkflowTrigger } from '@/types/workflow';

/**
 * WorkflowEngine: Automatiza acciones basadas en eventos detectados por el Sistema.
 * (Fase 10)
 */
export class WorkflowEngine {
    private static instance: WorkflowEngine;

    private constructor() { }

    public static getInstance(): WorkflowEngine {
        if (!WorkflowEngine.instance) {
            WorkflowEngine.instance = new WorkflowEngine();
        }
        return WorkflowEngine.instance;
    }

    /**
     * Evalúa y ejecuta flujos de trabajo basados en un evento.
     */
    public async processEvent(
        eventType: WorkflowTrigger['type'],
        data: any,
        tenantId: string,
        correlationId: string
    ) {
        try {
            // 1. Obtener flujos activos para este tenant y tipo de evento
            const collection = await getTenantCollection('ai_workflows', { user: { tenantId } });
            const workflows = await collection.find({ active: true, 'trigger.type': eventType }) as unknown as AIWorkflow[];

            for (const wf of workflows) {
                if (this.evaluateTrigger(wf.trigger, data)) {
                    await this.executeActions(wf.actions, data, tenantId, correlationId);

                    await logEvento({
                        level: 'INFO',
                        source: 'WORKFLOW_ENGINE',
                        action: 'EXECUTE_WORKFLOW',
                        message: `Executed workflow "${wf.name}" for tenant ${tenantId}`,
                        correlationId,
                        details: { workflowId: wf.id }
                    });
                }
            }
        } catch (error: any) {
            console.error('[WorkflowEngine] Error processing event:', error);
        }
    }

    private evaluateTrigger(trigger: WorkflowTrigger, data: any): boolean {
        const { field, operator, value } = trigger.condition;
        const actualValue = data[field];

        if (actualValue === undefined) return false;

        switch (operator) {
            case 'gt': return actualValue > value;
            case 'lt': return actualValue < value;
            case 'eq': return actualValue === value;
            case 'contains': return Array.isArray(actualValue) ? actualValue.includes(value) : String(actualValue).includes(String(value));
            default: return false;
        }
    }

    private async executeActions(actions: WorkflowAction[], data: any, tenantId: string, correlationId: string) {
        for (const action of actions) {
            switch (action.type) {
                case 'notify':
                    // Mock: En un sistema real, enviaría a un servicio de notificaciones/Pusher/Email
                    console.log(`[WorkflowAction] NOTIFICACIÓN: ${action.params.message} `, data);
                    break;
                case 'log':
                    await logEvento({
                        level: 'WARN',
                        source: 'AI_AUTOMATION',
                        action: 'AUTOMATED_ALERT',
                        message: action.params.message || 'Alerta automatizada detectada',
                        correlationId,
                        details: { triggerData: data }
                    });
                    break;
                case 'update_entity':
                    // Evaluación de Gobierno (Fase KIMI 12)
                    const gov = GovernanceEngine.getInstance();
                    const { canExecute } = await gov.evaluateAction(
                        'WORKFLOW_ENGINE',
                        action.params.entitySlug || '*',
                        'update_entity',
                        tenantId
                    );

                    if (!canExecute) {
                        await gov.logDecision({
                            agentId: 'WORKFLOW_ENGINE',
                            entitySlug: action.params.entitySlug || '*',
                            actionType: 'update_entity',
                            decision: action.params,
                            confidence: 1.0,
                            status: 'blocked',
                            tenantId,
                            correlationId
                        });
                        break;
                    }

                    // Ejemplo: Cambiar estado del pedido si el riesgo es alto
                    const { entitySlug, idField, updates } = action.params;
                    const id = data[idField];
                    if (id && entitySlug) {
                        const coll = await getTenantCollection(entitySlug, { user: { tenantId } });
                        await coll.updateOne({ _id: id } as any, { $set: updates });

                        await gov.logDecision({
                            agentId: 'WORKFLOW_ENGINE',
                            entitySlug: entitySlug,
                            actionType: 'update_entity',
                            decision: updates,
                            confidence: 1.0,
                            status: 'executed',
                            tenantId,
                            correlationId
                        });
                    }
                    break;
            }
        }
    }
}
