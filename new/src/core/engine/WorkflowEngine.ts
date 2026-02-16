
import { logEvento } from '@/lib/logger';
import { getTenantCollection } from '@/lib/db-tenant';
import { GovernanceEngine } from './GovernanceEngine';
import { AIWorkflow, WorkflowAction, WorkflowTrigger } from '@/types/workflow';
import { WorkflowAnalyticsService } from '@/lib/workflow-analytics-service';

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
            const sessionObj = { user: { tenantId } };
            const collection = await getTenantCollection('ai_workflows', sessionObj);
            const workflows = await collection.find({ active: true, 'trigger.type': eventType }) as unknown as AIWorkflow[];

            for (const wf of workflows) {
                const startTime = Date.now();
                const isTriggered = this.evaluateTrigger(wf.trigger, data);
                const duration = Date.now() - startTime;

                // Analytics: Record Trigger Evaluation
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

    private async executeActions(workflowId: string, actions: WorkflowAction[], data: any, tenantId: string, correlationId: string) {
        for (const action of actions) {
            const startTime = Date.now();
            let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
            let errorMessage: string | undefined;

            try {
                switch (action.type) {
                    case 'branch':
                        const criteria = action.params.criteria || {};
                        const risk = data.riskScore || data.score || 0;
                        const confidence = data.confidenceScore || 1;

                        // RAG-Driven: evaluate confidence if present
                        const threshold = criteria.confidenceThreshold || 0.7;

                        if (confidence < threshold) {
                            console.log(`[WorkflowEngine] Branching: LOW CONFIDENCE path detected (${confidence} < ${threshold})`);
                        } else if (risk > 75 || String(action.params.label).toLowerCase().includes('critical')) {
                            console.log(`[WorkflowEngine] Branching: CRITICAL path taken for ${workflowId}`);
                        }
                        break;

                    case 'human_task':
                        const taskCollection = await getTenantCollection('workflow_tasks', { user: { tenantId } });
                        const taskPayload = {
                            tenantId,
                            caseId: data._id || data.id || data.caseId || 'unlinked-case',
                            type: action.params.taskType || 'DOCUMENT_REVIEW',
                            title: action.params.title || 'Validación requerida por Workflow',
                            description: action.params.description || `Se requiere revisión humana para el flujo ${workflowId}. Motivo: ${data.reason || 'Análisis RAG crítico'}`,
                            assignedRole: action.params.assignedRole || 'ADMIN',
                            status: 'PENDING',
                            priority: action.params.priority || 'MEDIUM',
                            metadata: {
                                correlationId,
                                workflowId,
                                triggerData: data,
                                nodeLabel: action.params.label,
                                checklistConfigId: action.params.checklistConfigId // New: Link to business rules
                            },
                            createdAt: new Date(),
                            updatedAt: new Date()
                        };
                        await taskCollection.insertOne(taskPayload);
                        await logEvento({
                            level: 'INFO',
                            source: 'WORKFLOW_ENGINE',
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

                        console.log(`[WorkflowEngine] Delay: Sleeping for ${ms}ms...`);
                        await new Promise(resolve => setTimeout(resolve, ms));
                        break;

                    case 'iterator':
                        console.log(`[WorkflowEngine] Iterator: Processing loop for ${action.params.source}`);
                        // Mock iteration for now
                        break;

                    case 'notify':
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
