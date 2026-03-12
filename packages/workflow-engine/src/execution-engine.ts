
import { logEvento } from '@abd/platform-core/server';
import { GovernanceEngine } from '@/core/engine/GovernanceEngine';
import { AIWorkflow, WorkflowAction, WorkflowActionType, WorkflowTrigger, WorkflowTriggerType } from './types';
import { WorkflowAnalyticsService } from '@/services/ops/workflow-analytics-service';
import { MongoAIWorkflowRepository } from '@/core/adapters/persistence/MongoAIWorkflowRepository';
import { MongoCaseWorkflowRepository } from '@/core/adapters/persistence/MongoCaseWorkflowRepository';
import { WorkflowTask, WorkflowTaskStatus } from './schemas';
import { TenantIdSchema, EntityIdSchema, TenantId, EntityId } from '@abd/platform-core';

import { workflowExecutionRepository } from '@/lib/repositories/WorkflowExecutionRepository';
import { WorkflowExecution } from '@/lib/schemas/workflow-types';

/**
 * AIWorkflowEngine: Automatiza acciones basadas en eventos detectados por el Sistema.
 * (Refactored from Legacy WorkflowEngine in Phase 129)
 * Hardened Era 12: Procedural Visibility & Relational Integrity.
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
        const tId = TenantIdSchema.parse(tenantId);
        const session = { user: { id: 'system', tenantId: tId, role: 'SYSTEM' } } as any;

        try {
            const workflows = await this.workflowRepository.findActiveByTrigger(eventType, tId);

            for (const wf of workflows) {
                const startTime = Date.now();
                const isTriggered = this.evaluateTrigger(wf.trigger, data);
                const duration = Date.now() - startTime;

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
                        metadata: { triggerType: eventType }
                    } as any, session);

                    try {
                        await this.executeActions(wfId, executionId, wf.actions, data, tId, correlationId, session);
                        await workflowExecutionRepository.update(executionId, { $set: { status: 'COMPLETED' } } as any, session);
                    } catch (err: any) {
                        await workflowExecutionRepository.update(executionId, { $set: { status: 'FAILED' } } as any, session);
                        throw err;
                    }

                    await logEvento({
                        level: 'INFO',
                        source: 'AI_WORKFLOW_ENGINE',
                        action: 'EXECUTE_WORKFLOW',
                        message: `Executed workflow "${wf.name}" for tenant ${tenantId}`,
                        correlationId,
                        details: { workflowId: wf.id, executionId }
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

    private async executeActions(
        workflowId: EntityId,
        executionId: EntityId,
        actions: WorkflowAction[],
        data: any,
        tenantId: TenantId,
        correlationId: string,
        session?: any
    ) {
        for (const action of actions) {
            const startTime = Date.now();
            let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
            let errorMessage: string | undefined;

            try {
                // Update node status to RUNNING
                if (action.nodeId) {
                    await workflowExecutionRepository.updateNodeStatus(executionId, action.nodeId, 'RUNNING', {}, session);
                }

                switch (action.type) {
                    case (WorkflowActionType as any).branch:
                        const { criteria } = action.params as any;
                        if (criteria) {
                            const { confidenceThreshold } = criteria as any;
                            if (confidenceThreshold !== undefined && data.confidenceScore !== undefined) {
                                if (data.confidenceScore >= confidenceThreshold) {
                                    await logEvento({
                                        level: 'INFO',
                                        source: 'AI_WORKFLOW_ENGINE',
                                        action: 'BRANCH_SKIPPED',
                                        message: `Confidence ${data.confidenceScore} >= ${confidenceThreshold}. Skipping next actions.`,
                                        correlationId,
                                        tenantId
                                    });
                                    return; // Stop execution of the rest of the actions in this flow
                                }
                            }
                        }
                        break;

                    case (WorkflowActionType as any).human_task:
                        const taskPayload: WorkflowTask = {
                            tenantId,
                            caseId: EntityIdSchema.parse(data._id || data.id || data.caseId || '000000000000000000000000'),
                            type: (action.params.taskType as any) || 'DOCUMENT_REVIEW',
                            title: action.params.title || 'Validación requerida por Workflow',
                            description: action.params.description || `Se requiere revisión humana para el flujo ${workflowId}.`,
                            assignedRole: ((action.params as any).assignedRole as any) || 'ADMIN',
                            status: 'PENDING' as WorkflowTaskStatus,
                            priority: ((action.params as any).priority as any) || 'MEDIUM',
                            metadata: {
                                correlationId,
                                workflowId,
                                nodeId: action.nodeId,
                                nodeLabel: (action.params as any).label,
                                checklistConfigId: (action.params as any).checklistConfigId ? EntityIdSchema.parse((action.params as any).checklistConfigId) : undefined
                            },
                            createdAt: new Date(),
                            updatedAt: new Date()
                        };

                        await this.caseWorkflowRepository.createTask(taskPayload);
                        break;

                    case WorkflowActionType.delay:
                        const duration = Number(action.params.duration) || 1000;
                        const unit = action.params.unit || 'ms';
                        const ms = unit === 's' ? duration * 1000 : unit === 'm' ? duration * 60000 : duration;
                        await new Promise(resolve => setTimeout(resolve, ms));
                        break;

                    case WorkflowActionType.iterator:
                        break;

                    case WorkflowActionType.notify:
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
        }
    }
}
