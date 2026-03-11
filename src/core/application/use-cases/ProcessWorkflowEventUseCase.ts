import { IAIWorkflowRepository } from '../../domain/repositories/IAIWorkflowRepository';
import { ActionHandlerRegistry } from '../services/ActionHandlerRegistry';
import { WorkflowTrigger, AIWorkflow } from '@/types/workflow';
import { WorkflowAnalyticsService } from '@/services/ops/workflow-analytics-service';
import { IntelligenceWorker } from '@/services/ops/intelligence-worker';
import { logEvento } from '@/lib/logger';
import { workflowExecutionRepository } from '@/lib/repositories/WorkflowExecutionRepository';
import { EntityIdSchema, TenantIdSchema } from '@/lib/schemas/common';

export class ProcessWorkflowEventUseCase {
    constructor(
        private workflowRepo: IAIWorkflowRepository,
        private handlerRegistry: ActionHandlerRegistry
    ) { }

    async execute(eventType: WorkflowTrigger['type'], data: any, tenantId: string, correlationId: string) {
        const tId = TenantIdSchema.parse(tenantId);
        const session = { user: { id: 'system', tenantId: tId, role: 'SYSTEM' } } as any;

        try {
            const workflows = await this.workflowRepo.findActiveByTrigger(eventType, tenantId);

            for (const wf of workflows) {
                const isTriggered = this.evaluateTrigger(wf.trigger, data);

                if (isTriggered) {
                    const wfId = EntityIdSchema.parse(wf.id || (wf as any)._id);

                    // 🚀 ERA 12: Start Persistent Workflow Execution
                    const executionId = await workflowExecutionRepository.create({
                        tenantId: tId,
                        workflowDefinitionId: wfId,
                        status: 'RUNNING',
                        triggeredByUserId: (data.userId || 'system') as any,
                        correlationId,
                        currentState: 'triggered',
                        nodes: wf.actions.map((a: any) => ({
                            nodeId: a.nodeId || 'unknown',
                            type: a.type,
                            status: 'PENDING'
                        })),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        metadata: { triggerType: eventType, triggerSource: 'automated_use_case' }
                    } as any, session);

                    try {
                        await this.executeActions(wf, executionId, data, tenantId, correlationId, session);
                        await workflowExecutionRepository.update(executionId, { $set: { status: 'COMPLETED' } } as any, session);
                    } catch (err: any) {
                        await workflowExecutionRepository.update(executionId, { $set: { status: 'FAILED' } } as any, session);
                        throw err;
                    }
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

    private async executeActions(workflow: AIWorkflow, executionId: any, data: any, tenantId: string, correlationId: string, session: any) {
        const workflowId = workflow.id || String((workflow as any)._id);

        for (const action of workflow.actions) {
            const startTime = Date.now();
            let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
            let errorMessage: string | undefined;

            try {
                // Update node status to RUNNING
                if (action.nodeId) {
                    await workflowExecutionRepository.updateNodeStatus(executionId, action.nodeId, 'RUNNING', {}, session);
                }

                const context = {
                    workflowId,
                    tenantId,
                    correlationId,
                    triggerData: data
                };

                const result = await this.handlerRegistry.executeAction(action, context);
                status = result.status;
                errorMessage = result.errorMessage;
            } catch (error: any) {
                status = 'FAILED';
                errorMessage = error.message;
            } finally {
                // 🚀 ERA 12: Complete Node Tracing
                if (action.nodeId) {
                    await workflowExecutionRepository.updateNodeStatus(
                        executionId,
                        action.nodeId,
                        status === 'SUCCESS' ? 'COMPLETED' : 'FAILED',
                        {
                            durationMs: Date.now() - startTime,
                            error: errorMessage,
                            ragQueryLogId: (data.ragQueryLogId || (action.params as any)?.ragQueryLogId) as any
                        },
                        session
                    );

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

            if (status === 'SUCCESS') {
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
            details: { workflowId, executionId }
        });
    }
}
