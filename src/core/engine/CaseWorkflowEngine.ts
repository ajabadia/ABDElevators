

import { logEvento } from '@/lib/logger';
import { WorkflowDefinition } from '@/lib/schemas/workflow';
import { WorkflowLLMNodeService } from '@/lib/workflow-llm-node-service';
import { WorkflowTaskService } from '@/lib/workflow-task-service';
import { UserRole } from '@/types/roles';
import { MongoCaseRepository } from '../adapters/persistence/MongoCaseRepository';
import { MongoAIWorkflowRepository } from '../adapters/persistence/MongoAIWorkflowRepository';
import { MongoCaseWorkflowRepository } from '../adapters/persistence/MongoCaseWorkflowRepository';

/**
 * CaseWorkflowEngine: Gestiona el ciclo de vida (Estados y Transiciones) de un Caso.
 * (Phase 129 - New Engine)
 * ⚡ FASE 127: Extended with LLM orchestration capabilities
 * 
 * Responsabilidad:
 * - Validar transiciones de estado
 * - Verificar permisos (Roles) for transitions
 * - Ejecutar LLM nodes cuando se entra en un estado
 * - Manejar decisiones LLM-driven con HITL
 * - Ejecutar side-effects de transición (hooks)
 */
export class CaseWorkflowEngine {
    private static instance: CaseWorkflowEngine;
    private caseRepository: MongoCaseRepository;
    private workflowRepository: MongoAIWorkflowRepository;
    private caseWorkflowRepository: MongoCaseWorkflowRepository;


    private constructor() {
        this.caseRepository = new MongoCaseRepository();
        this.workflowRepository = new MongoAIWorkflowRepository();
        this.caseWorkflowRepository = new MongoCaseWorkflowRepository();
    }

    public static getInstance(): CaseWorkflowEngine {
        if (!CaseWorkflowEngine.instance) {
            CaseWorkflowEngine.instance = new CaseWorkflowEngine();
        }
        return CaseWorkflowEngine.instance;
    }

    /**
     * Ejecuta una transición de estado en un caso.
     */
    public async executeTransition(
        caseId: string,
        transitionId: string, // Or targetState? Usually transitions have IDs or we derive from (from->to)
        tenantId: string,
        userId: string,
        userRoles: string[],
        correlationId: string
    ): Promise<{ success: boolean; newState?: string; error?: string }> {
        try {
            // 1. Get Case
            const caseData = await this.caseRepository.findById(caseId, tenantId);

            if (!caseData) {
                throw new Error(`Case ${caseId} not found`);
            }

            // 2. Get Workflow Definition
            const workflowDef = await this.workflowRepository.getDefinition(tenantId, 'ENTITY'); // Assuming 'ENTITY' covers Cases for now

            if (!workflowDef) {
                throw new Error('No active workflow definition found for Cases');
            }

            // 3. Find Transition
            const currentState = caseData.status || workflowDef.initial_state;
            const transition = workflowDef.transitions.find(t => t.from === currentState && t.to === transitionId);

            // If we are passing "targetState" as transitionId
            const targetState = transitionId;
            const validTransition = workflowDef.transitions.find(t => t.from === currentState && t.to === targetState);

            if (!validTransition) {
                return { success: false, error: `Invalid transition from ${currentState} to ${targetState}` };
            }

            // 4. Validate Roles
            if (validTransition.required_role && validTransition.required_role.length > 0) {
                const hasRole = validTransition.required_role.some(r => userRoles.includes(r));
                if (!hasRole) {
                    return { success: false, error: `User does not have required role: ${validTransition.required_role.join(', ')}` };
                }
            }

            // 5. Check if target state has LLM node enabled
            const targetStateConfig = workflowDef.states.find(s => s.id === targetState);
            let llmOutput: Record<string, any> | null = null;

            if (targetStateConfig?.llmNode?.enabled) {
                try {
                    llmOutput = await WorkflowLLMNodeService.runNode({
                        tenantId,
                        caseId,
                        stateId: targetState,
                        llmNodeConfig: targetStateConfig.llmNode,
                        caseContext: caseData,
                        correlationId,
                    });

                    // Store LLM output in case metadata
                    await this.caseRepository.update(
                        caseId,
                        {
                            metadata: {
                                ...caseData.metadata,
                                workflow: {
                                    ...caseData.metadata?.workflow,
                                    llmOutputs: {
                                        ...caseData.metadata?.workflow?.llmOutputs,
                                        [targetState]: llmOutput
                                    }
                                }
                            }
                        },
                        tenantId
                    );

                    await logEvento({
                        level: 'INFO',
                        source: 'CASE_WORKFLOW_ENGINE',
                        action: 'LLM_NODE_EXECUTED',
                        message: `LLM node executed for state ${targetState}`,
                        correlationId,
                        details: { caseId, stateId: targetState, llmOutput },
                    });

                    // ⚡ FASE 165.5: If LLM failed and returned fallback, create a task for manual check
                    if (llmOutput.source === 'LLM_FALLBACK') {
                        await WorkflowTaskService.createTask({
                            tenantId,
                            caseId,
                            type: 'DOCUMENT_REVIEW', // Or a general REVIEW type
                            title: `Manual Review Required: LLM Failure in ${targetState}`,
                            description: `The LLM node failed for this state. Reason: ${llmOutput.reason}. A manual review of the automated analysis is required.`,
                            assignedRole: UserRole.TECHNICAL,
                            priority: 'MEDIUM',
                            metadata: {
                                stateId: targetState,
                                correlationId,
                                error: llmOutput.reason
                            },
                            correlationId,
                        });
                    }
                } catch (llmError: any) {
                    await logEvento({
                        level: 'ERROR',
                        source: 'CASE_WORKFLOW_ENGINE',
                        action: 'LLM_NODE_ERROR',
                        message: `LLM node execution failed: ${llmError.message}`,
                        correlationId,
                        details: { caseId, stateId: targetState, error: llmError.message },
                    });
                    // Continue with transition even if LLM fails (graceful degradation)
                }
            }

            // 6. Update State
            await this.caseRepository.updateStatus(
                caseId,
                targetState,
                {
                    from: currentState,
                    to: targetState,
                    by: userId,
                    at: new Date(),
                    correlationId,
                    llmOutput: llmOutput ? { riskLevel: llmOutput.riskLevel, confidence: llmOutput.confidence } : undefined,
                },
                tenantId
            );

            await logEvento({
                level: 'INFO',
                source: 'CASE_WORKFLOW_ENGINE',
                action: 'STATE_TRANSITION',
                message: `Case ${caseId} transitioned from ${currentState} to ${targetState}`,
                correlationId,
                details: { caseId, from: currentState, to: targetState, userId }
            });

            return { success: true, newState: targetState };

        } catch (error: any) {
            console.error('[CaseWorkflowEngine] Transition error:', error);
            await logEvento({
                level: 'ERROR',
                source: 'CASE_WORKFLOW_ENGINE',
                action: 'TRANSITION_ERROR',
                message: error.message,
                correlationId,
                details: { stack: error.stack }
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * ⚡ FASE 127: Execute LLM-driven transition
     * Handles automatic routing based on LLM decision strategy
     */
    public async executeLLMTransition(
        caseId: string,
        currentState: string,
        tenantId: string,
        userId: string,
        userRoles: string[],
        correlationId: string
    ): Promise<{ success: boolean; newState?: string; taskCreated?: boolean; error?: string }> {
        try {
            // 1. Get Case and Workflow
            const caseData = await this.caseRepository.findById(caseId, tenantId);

            if (!caseData) {
                throw new Error(`Case ${caseId} not found`);
            }

            const workflowDef = await this.workflowRepository.getDefinition(tenantId, 'ENTITY');

            if (!workflowDef) {
                throw new Error('No active workflow definition found');
            }

            // 2. Find transitions from current state with LLM decision strategy
            const llmTransitions = workflowDef.transitions.filter(
                t => t.from === currentState && t.decisionStrategy && t.decisionStrategy !== 'USER'
            );

            if (llmTransitions.length === 0) {
                return { success: false, error: 'No LLM transitions available from current state' };
            }

            // 3. Get LLM output from current state
            const llmOutput = caseData.metadata?.workflow?.llmOutputs?.[currentState];

            if (!llmOutput) {
                return { success: false, error: 'No LLM output available for current state' };
            }

            // 4. Process based on decision strategy
            for (const transition of llmTransitions) {
                if (transition.decisionStrategy === 'LLM_DIRECT' && transition.llmRouting) {
                    // Auto-route based on LLM decision
                    const nextState = await WorkflowLLMNodeService.route({
                        tenantId,
                        caseId,
                        llmOutput,
                        llmRouting: transition.llmRouting,
                        correlationId,
                    });

                    // Execute transition
                    const result = await this.executeTransition(
                        caseId,
                        nextState,
                        tenantId,
                        userId,
                        userRoles,
                        correlationId
                    );

                    // ⚡ FASE 165.5: If nextState was a fallback to manual review, ensure we log it clearly
                    if (nextState === 'PENDING_MANUAL_REVIEW') {
                        await WorkflowTaskService.createTask({
                            tenantId,
                            caseId,
                            type: 'WORKFLOW_DECISION',
                            title: `Manual Routing Required for ${caseData.identifier || caseId}`,
                            description: `The LLM failed to decide the next branch from ${currentState}. Manual routing required.`,
                            assignedRole: UserRole.ADMIN,
                            priority: 'HIGH',
                            metadata: { currentState, correlationId, source: 'LLM_FALLBACK' },
                            correlationId
                        });
                    }

                    return result;
                }

                if (transition.decisionStrategy === 'LLM_SUGGEST_HUMAN_APPROVE' && transition.llmRouting) {
                    // Create HITL task with LLM suggestion
                    const suggestedState = await WorkflowLLMNodeService.route({
                        tenantId,
                        caseId,
                        llmOutput,
                        llmRouting: transition.llmRouting,
                        correlationId,
                    });

                    // Create workflow decision task
                    await WorkflowTaskService.createTask({
                        tenantId,
                        caseId,
                        type: 'WORKFLOW_DECISION',
                        title: `Review LLM Decision for ${caseData.identifier || caseId}`,
                        description: `The AI has analyzed this case and suggests transitioning to: ${suggestedState}`,
                        assignedRole: transition.required_role?.[0] as UserRole || UserRole.ADMIN,
                        priority: llmOutput.riskLevel === 'HIGH' || llmOutput.riskLevel === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
                        metadata: {
                            workflowId: workflowDef._id?.toString(),
                            nodeLabel: currentState,
                            correlationId,
                            llmProposal: {
                                suggestedNextState: suggestedState,
                                suggestedAction: 'APPROVE',
                                score: llmOutput.confidence || 0.8,
                                reason: llmOutput.reason || 'LLM analysis complete',
                                rawOutputId: correlationId,
                            },
                        },
                        correlationId,
                    });

                    await logEvento({
                        level: 'INFO',
                        source: 'CASE_WORKFLOW_ENGINE',
                        action: 'HITL_TASK_CREATED',
                        message: `HITL task created for LLM decision`,
                        correlationId,
                        details: { caseId, suggestedState, currentState },
                    });

                    return { success: true, taskCreated: true };
                }
            }

            return { success: false, error: 'No applicable LLM transition found' };
        } catch (error: any) {
            console.error('[CaseWorkflowEngine] LLM Transition error:', error);
            await logEvento({
                level: 'ERROR',
                source: 'CASE_WORKFLOW_ENGINE',
                action: 'LLM_TRANSITION_ERROR',
                message: error.message,
                correlationId,
                details: { stack: error.stack }
            });
            return { success: false, error: error.message };
        }
    }
}
