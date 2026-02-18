
import { logEvento } from '@/lib/logger';
import { GovernanceEngine } from './GovernanceEngine';
import { AIWorkflow, WorkflowAction, WorkflowActionType, WorkflowTrigger, WorkflowTriggerType } from '@/types/workflow';
import { WorkflowAnalyticsService } from '@/lib/workflow-analytics-service';
import { MongoAIWorkflowRepository } from '../adapters/persistence/MongoAIWorkflowRepository';
import { MongoCaseWorkflowRepository } from '../adapters/persistence/MongoCaseWorkflowRepository';
import { WorkflowTask, WorkflowTaskStatus } from '@/lib/schemas/workflow-task';

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
    private workflowRepository: MongoAIWorkflowRepository;
    private caseWorkflowRepository: MongoCaseWorkflowRepository;

    private constructor() {
        this.workflowRepository = new MongoAIWorkflowRepository();
        this.caseWorkflowRepository = new MongoCaseWorkflowRepository();
    }

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
        eventType: WorkflowTriggerType,
        data: any,
        tenantId: string,
        correlationId: string
    ) {
        try {
            const workflows = await this.workflowRepository.findActiveByTrigger(eventType, tenantId);

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
                    case (WorkflowActionType as any).branch:
                        // TODO: Implement proper branching execution based on criteria
                        break;

                    case (WorkflowActionType as any).human_task:
                        const taskPayload: WorkflowTask = {
                            tenantId,
                            caseId: data._id || data.id || data.caseId || 'unlinked-case',
                            type: (action.params.taskType as any) || 'DOCUMENT_REVIEW',
                            title: action.params.title || 'Validación requerida por Workflow',
                            description: action.params.description || `Se requiere revisión humana para el flujo ${workflowId}.`,
                            assignedRole: (action.params.assignedRole as any) || 'ADMIN',
                            status: 'PENDING' as WorkflowTaskStatus,
                            priority: (action.params.priority as any) || 'MEDIUM',
                            metadata: {
                                correlationId,
                                workflowId,
                                nodeLabel: (action.params as any).label,
                                checklistConfigId: (action.params as any).checklistConfigId
                            },
                            createdAt: new Date(),
                            updatedAt: new Date()
                        };

                        await this.caseWorkflowRepository.createTask(taskPayload);
                        // Logging handled by repository
                        break;

                    case WorkflowActionType.delay:
                        const duration = Number(action.params.duration) || 1000;
                        const unit = action.params.unit || 'ms';
                        const ms = unit === 's' ? duration * 1000 : unit === 'm' ? duration * 60000 : duration;
                        await new Promise(resolve => setTimeout(resolve, ms));
                        break;

                    case WorkflowActionType.iterator:
                        // Mock iteration
                        break;

                    case WorkflowActionType.notify:
                        // Notification logic
                        break;

                    case WorkflowActionType.log:
                        await logEvento({
                            level: 'WARN',
                            source: 'AI_AUTOMATION',
                            action: 'AUTOMATED_ALERT',
                            message: action.params.message || 'Alerta automatizada detectada',
                            correlationId,
                            details: { triggerData: data }
                        });
                        break;

                    case WorkflowActionType.update_entity:
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
                            await this.caseWorkflowRepository.updateEntity(entitySlug, id, updates, tenantId);
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
