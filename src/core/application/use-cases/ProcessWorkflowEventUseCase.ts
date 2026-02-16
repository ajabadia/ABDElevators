import { IAIWorkflowRepository } from '../../domain/repositories/IAIWorkflowRepository';
import { ActionHandlerRegistry } from '../services/ActionHandlerRegistry';
import { WorkflowTrigger, AIWorkflow } from '@/types/workflow';
import { WorkflowAnalyticsService } from '@/lib/workflow-analytics-service';
import { logEvento } from '@/lib/logger';

export class ProcessWorkflowEventUseCase {
    constructor(
        private workflowRepo: IAIWorkflowRepository,
        private handlerRegistry: ActionHandlerRegistry
    ) { }

    async execute(eventType: WorkflowTrigger['type'], data: any, tenantId: string, correlationId: string) {
        try {
            const workflows = await this.workflowRepo.findActiveByTrigger(eventType, tenantId);

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
                    await this.executeActions(wf, data, tenantId, correlationId);
                }
            }
        } catch (error: any) {
            console.error('[ProcessWorkflowEventUseCase] Error:', error);
            throw error;
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

    private async executeActions(workflow: AIWorkflow, data: any, tenantId: string, correlationId: string) {
        const workflowId = workflow.id || String((workflow as any)._id);

        for (const action of workflow.actions) {
            const startTime = Date.now();

            const context = {
                workflowId,
                tenantId,
                correlationId,
                triggerData: data
            };

            const result = await this.handlerRegistry.executeAction(action, context);

            // Analytics: Record Action Execution
            if (action.nodeId) {
                await WorkflowAnalyticsService.recordEvent({
                    workflowId,
                    nodeId: action.nodeId,
                    tenantId,
                    type: 'action',
                    status: result.status,
                    durationMs: Date.now() - startTime,
                    correlationId,
                    error: result.errorMessage
                });
            }

            if (result.status === 'SUCCESS') {
                await logEvento({
                    level: 'INFO',
                    source: 'WORKFLOW_ENGINE',
                    action: 'EXECUTE_ACTION',
                    message: `Action ${action.type} executed for workflow ${workflowId}`,
                    correlationId
                });
            }
        }

        await logEvento({
            level: 'INFO',
            source: 'WORKFLOW_ENGINE',
            action: 'EXECUTE_WORKFLOW',
            message: `Executed workflow "${workflow.name}" for tenant ${tenantId}`,
            correlationId,
            details: { workflowId }
        });
    }
}
