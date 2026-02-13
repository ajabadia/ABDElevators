
import { logEvento } from '@/lib/logger';
import { getTenantCollection } from '@/lib/db-tenant';
import { GovernanceEngine } from './GovernanceEngine';
import { AIWorkflow, WorkflowAction, WorkflowTrigger } from '@/types/workflow';
import { WorkflowAnalyticsService } from '@/lib/workflow-analytics-service';

/**
 * AIWorkflowEngine: Automatiza acciones basadas en eventos detectados por el Sistema.
 * (Refactored from Legacy WorkflowEngine in Phase 129)
 * 
 * Responsabilidad:
 * - Escuchar eventos (Triggers)
 * - Evaluar condiciones
 * - Ejecutar acciones (Actions)
 * - Trazabilidad (Analytics)
 */
export class AIWorkflowEngine {
    private static instance: AIWorkflowEngine;

    private constructor() { }

    public static getInstance(): AIWorkflowEngine {
        if (!AIWorkflowEngine.instance) {
            AIWorkflowEngine.instance = new AIWorkflowEngine();
        }
        return AIWorkflowEngine.instance;
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
            const sessionObj = { user: { tenantId } };
            const collection = await getTenantCollection('ai_workflows', sessionObj);
            const workflows = await collection.find({ active: true, 'trigger.type': eventType }) as unknown as AIWorkflow[];

            for (const wf of workflows) {
                const startTime = Date.now();
                const isTriggered = this.evaluateTrigger(wf.trigger, data);
                const duration = Date.now() - startTime;

                if (wf.trigger.nodeId) {
                    await WorkflowAnalyticsService.recordEvent({
                        workflowId: wf.id || String((wf as any)._id),
                        nodeId: wf.trigger.nodeId,
                        tenantId,
                        type: 'trigger',
                        status: isTriggered ? 'SUCCESS' : 'SKIPPED',
                        durationMs: duration,
                        correlationId
                    });
                }

                if (isTriggered) {
                    await this.executeActions(wf.id || String((wf as any)._id), wf.actions, data, tenantId, correlationId);

                    await logEvento({
                        level: 'INFO',
                        source: 'AI_WORKFLOW_ENGINE',
                        action: 'EXECUTE_WORKFLOW',
                        message: `Executed workflow "${wf.name}" for tenant ${tenantId}`,
                        correlationId,
                        details: { workflowId: wf.id }
                    });
                }
            }
        } catch (error: any) {
            console.error('[AIWorkflowEngine] Error processing event:', error);
            await logEvento({
                level: 'ERROR',
                source: 'AI_WORKFLOW_ENGINE',
                action: 'PROCESS_ERROR',
                message: error.message,
                correlationId,
                details: { stack: error.stack }
            });
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

    private async executeActions(workflowId: string, actions: WorkflowAction[], data: any, tenantId: string, correlationId: string) {
        for (const action of actions) {
            const startTime = Date.now();
            let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
            let errorMessage: string | undefined;

            try {
                switch (action.type) {
                    case 'branch':
                        // TODO: Implement proper branching execution based on criteria
                        break;

                    case 'human_task':
                        const taskCollection = await getTenantCollection('workflow_tasks', { user: { tenantId } });
                        const taskPayload = {
                            tenantId,
                            caseId: data._id || data.id || data.caseId || 'unlinked-case',
                            type: action.params.taskType || 'DOCUMENT_REVIEW',
                            title: action.params.title || 'Validación requerida por Workflow',
                            description: action.params.description || `Se requiere revisión humana para el flujo ${workflowId}.`,
                            assignedRole: action.params.assignedRole || 'ADMIN',
                            status: 'PENDING',
                            priority: action.params.priority || 'MEDIUM',
                            metadata: {
                                correlationId,
                                workflowId,
                                triggerData: data,
                                nodeLabel: action.params.label,
                                checklistConfigId: action.params.checklistConfigId
                            },
                            createdAt: new Date(),
                            updatedAt: new Date()
                        };
                        await taskCollection.insertOne(taskPayload);
                        await logEvento({
                            level: 'INFO',
                            source: 'AI_WORKFLOW_ENGINE',
                            action: 'HUMAN_TASK_CREATED',
                            message: `Manual task generated for case ${taskPayload.caseId}`,
                            correlationId,
                            details: { workflowId, taskId: taskPayload.caseId }
                        });
                        break;

                    case 'delay':
                        const duration = Number(action.params.duration) || 1000;
                        const unit = action.params.unit || 'ms';
                        const ms = unit === 's' ? duration * 1000 : unit === 'm' ? duration * 60000 : duration;
                        await new Promise(resolve => setTimeout(resolve, ms));
                        break;

                    case 'iterator':
                        // Mock iteration
                        break;

                    case 'notify':
                        // Notification logic
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
                        // Governance Check
                        const gov = GovernanceEngine.getInstance();
                        const { canExecute } = await gov.evaluateAction(
                            'WORKFLOW_ENGINE',
                            action.params.entitySlug || '*',
                            'update_entity',
                            tenantId
                        );

                        if (!canExecute) {
                            status = 'FAILED';
                            errorMessage = 'Blocked by Governance Engine';
                            break;
                        }

                        const { entitySlug, idField, updates } = action.params;
                        const id = data[idField];
                        if (id && entitySlug) {
                            const coll = await getTenantCollection(entitySlug, { user: { tenantId } });
                            await coll.updateOne({ _id: id } as any, { $set: updates });
                        }
                        break;
                }
            } catch (error: any) {
                status = 'FAILED';
                errorMessage = error.message;
                console.error(`[AIWorkflowEngine] Action failed: ${action.type}`, error);
            } finally {
                // Analytics: Record Action Execution
                if (action.nodeId) {
                    await WorkflowAnalyticsService.recordEvent({
                        workflowId,
                        nodeId: action.nodeId,
                        tenantId,
                        type: 'action',
                        status,
                        durationMs: Date.now() - startTime,
                        correlationId,
                        error: errorMessage
                    });
                }
            }
        }
    }
}
