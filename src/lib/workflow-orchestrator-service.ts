/**
 * ⚡ FASE 127: Intelligent Workflow Orchestration
 * WorkflowOrchestratorService - LLM-driven workflow selection and proposal
 */

import { z } from 'zod';
import { WorkflowDefinition, WorkflowDefinitionSchema } from './schemas/workflow';
import { PromptService } from './prompt-service';
import { PROMPTS } from './prompts';
import { logEvento } from './logger';
import { safeParseLlmJson } from './safe-llm-json';
import { AppError, ValidationError } from './errors';
import { callGeminiMini } from './llm';
import { validateWorkflowDefinition } from './workflow-definition-validator';

// Zod schemas for LLM outputs
const WorkflowSuggestionSchema = z.object({
    action: z.enum(['USE_EXISTING', 'PROPOSE_NEW']),
    workflowId: z.string().optional(),
    reason: z.string(),
    confidence: z.number().min(0).max(1).transform(v => Math.round(v * 100) / 100),
});

const WorkflowProposalSchema = z.object({
    name: z.string(),
    entityType: z.enum(['ENTITY', 'EQUIPMENT', 'USER']),
    states: z.array(z.object({
        id: z.string(),
        label: z.string(),
        color: z.string().optional(),
        icon: z.string().optional(),
        is_initial: z.boolean(),
        is_final: z.boolean(),
        can_edit: z.boolean().optional(),
        requires_validation: z.boolean().optional(),
        roles_allowed: z.array(z.string()).optional(),
    })),
    transitions: z.array(z.object({
        from: z.string(),
        to: z.string(),
        label: z.string(),
        required_role: z.array(z.string()).optional(),
        conditions: z.object({
            checklist_complete: z.boolean().optional(),
            min_documents: z.number().optional(),
            require_signature: z.boolean().optional(),
            require_comment: z.boolean().optional(),
        }).optional(),
        actions: z.array(z.string()).optional(),
    })),
    initial_state: z.string(),
});

export type WorkflowSuggestion = z.infer<typeof WorkflowSuggestionSchema>;
export type WorkflowProposal = z.infer<typeof WorkflowProposalSchema>;

export class WorkflowOrchestratorService {
    /**
     * Suggests which workflow to use or proposes a new one
     */
    static async suggestWorkflow(params: {
        tenantId: string;
        entityType: 'ENTITY' | 'EQUIPMENT' | 'USER';
        description: string;
        existingWorkflows: WorkflowDefinition[];
        industry?: string;
        correlationId: string;
    }): Promise<WorkflowSuggestion> {
        const { tenantId, entityType, description, existingWorkflows, industry, correlationId } = params;

        await logEvento({
            level: 'INFO',
            source: 'WORKFLOW_ORCHESTRATOR',
            action: 'SUGGEST_WORKFLOW_START',
            message: `Starting workflow suggestion for ${entityType}`,
            tenantId,
            details: { entityType, workflowCount: existingWorkflows.length },
            correlationId,
        });

        try {
            // Simplify workflows for LLM context
            const workflowsSummary = existingWorkflows.map(w => ({
                id: w._id?.toString() || '',
                name: w.name,
                entityType: w.entityType,
                stateCount: w.states.length,
                states: w.states.map(s => s.label).join(' → '),
            }));

            // Get rendered prompt with fallback
            let renderedPrompt: string;

            try {
                const { text } = await PromptService.getRenderedPrompt(
                    'WORKFLOW_ROUTER',
                    {
                        vertical: (industry?.toUpperCase() || 'ELEVATORS'),
                        existingWorkflows: JSON.stringify(workflowsSummary, null, 2),
                        description,
                        entityType,
                        industry: (industry?.toUpperCase() || 'ELEVATORS'),
                    },
                    tenantId
                );
                renderedPrompt = text;
            } catch (err) {
                await logEvento({
                    level: 'WARN',
                    source: 'WORKFLOW_ORCHESTRATOR',
                    action: 'PROMPT_FALLBACK',
                    message: `Fallback to Master Prompt for WORKFLOW_ROUTER: ${err instanceof Error ? err.message : 'Unknown error'}`,
                    tenantId,
                    details: { error: err instanceof Error ? err.message : 'Unknown error' },
                    correlationId,
                });

                renderedPrompt = PROMPTS.WORKFLOW_ROUTER
                    .replace(/{{vertical}}/g, industry || 'elevadores')
                    .replace(/{{existingWorkflows}}/g, JSON.stringify(workflowsSummary, null, 2))
                    .replace(/{{description}}/g, description)
                    .replace(/{{entityType}}/g, entityType)
                    .replace(/{{industry}}/g, industry || 'elevadores');
            }

            // Call LLM
            const text = await callGeminiMini(
                renderedPrompt,
                tenantId,
                { correlationId, temperature: 0.3, model: 'gemini-2.0-flash-exp' }
            );

            // Parse and validate response using resilient utility
            const validated = await safeParseLlmJson({
                raw: text,
                schema: WorkflowSuggestionSchema,
                source: 'WORKFLOW_ORCHESTRATOR',
                correlationId,
                tenantId
            });

            await logEvento({
                level: 'INFO',
                source: 'WORKFLOW_ORCHESTRATOR',
                action: 'SUGGEST_WORKFLOW_SUCCESS',
                message: `Workflow suggested successfully: ${validated.action}`,
                tenantId,
                details: { action: validated.action, confidence: validated.confidence },
                correlationId,
            });

            return validated;
        } catch (error) {
            await logEvento({
                level: 'ERROR',
                source: 'WORKFLOW_ORCHESTRATOR',
                action: 'SUGGEST_WORKFLOW_ERROR',
                message: `Error suggesting workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
                tenantId,
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
                correlationId,
            });
            throw error;
        }
    }

    /**
     * Generates a complete workflow definition using LLM
     */
    static async proposeDefinition(params: {
        tenantId: string;
        entityType: 'ENTITY' | 'EQUIPMENT' | 'USER';
        description: string;
        industry?: string;
        correlationId: string;
    }): Promise<Partial<WorkflowDefinition>> {
        const { tenantId, entityType, description, industry, correlationId } = params;

        await logEvento({
            level: 'INFO',
            source: 'WORKFLOW_ORCHESTRATOR',
            action: 'PROPOSE_DEFINITION_START',
            message: `Proposing workflow definition for ${entityType}`,
            tenantId,
            details: { entityType, description },
            correlationId,
        });

        try {
            // Get rendered prompt with fallback
            let renderedPrompt: string;

            try {
                const { text } = await PromptService.getRenderedPrompt(
                    'WORKFLOW_GENERATOR',
                    {
                        vertical: (industry?.toUpperCase() || 'ELEVATORS'),
                        entityType,
                        industry: (industry?.toUpperCase() || 'ELEVATORS'),
                        description,
                    },
                    tenantId
                );
                renderedPrompt = text;
            } catch (err) {
                await logEvento({
                    level: 'WARN',
                    source: 'WORKFLOW_ORCHESTRATOR',
                    action: 'PROMPT_FALLBACK',
                    message: `Fallback to Master Prompt for WORKFLOW_GENERATOR: ${err instanceof Error ? err.message : 'Unknown error'}`,
                    tenantId,
                    details: { error: err instanceof Error ? err.message : 'Unknown error' },
                    correlationId,
                });

                renderedPrompt = PROMPTS.WORKFLOW_GENERATOR
                    .replace(/{{vertical}}/g, industry || 'elevadores')
                    .replace(/{{entityType}}/g, entityType)
                    .replace(/{{industry}}/g, industry || 'elevadores')
                    .replace(/{{description}}/g, description);
            }

            // Call LLM
            const text = await callGeminiMini(
                renderedPrompt,
                tenantId,
                { correlationId, temperature: 0.4, model: 'gemini-2.0-flash-exp' }
            );

            // Parse and validate response using resilient utility
            const validated = await safeParseLlmJson({
                raw: text,
                schema: WorkflowProposalSchema,
                source: 'WORKFLOW_ORCHESTRATOR',
                correlationId,
                tenantId
            });

            // Build complete WorkflowDefinition (as draft)
            const workflowDefinition: Partial<WorkflowDefinition> = {
                tenantId,
                industry: (industry?.toUpperCase() || 'ELEVATORS') as any,
                name: validated.name,
                entityType: validated.entityType,
                states: validated.states.map(s => ({
                    ...s,
                    color: s.color || '#64748b',
                    can_edit: s.can_edit ?? true,
                    requires_validation: s.requires_validation ?? false,
                    roles_allowed: s.roles_allowed || ['ADMIN', 'TECHNICAL'],
                })),
                transitions: validated.transitions.map(t => ({
                    ...t,
                    required_role: t.required_role || ['ADMIN'],
                    decisionStrategy: 'USER' as const,
                    conditions: {
                        checklist_complete: t.conditions?.checklist_complete ?? false,
                        min_documents: t.conditions?.min_documents ?? 0,
                        require_signature: t.conditions?.require_signature ?? false,
                        require_comment: t.conditions?.require_comment ?? false,
                    }
                })),
                initial_state: validated.initial_state,
                is_default: false,
                active: false,
                status: 'draft' as const, // ⚡ FASE 127: Always draft until human approval
                environment: 'PRODUCTION' as const,
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // ⚡ FASE 165.4: Validate the proposed definition before proceeding
            const validation = validateWorkflowDefinition(workflowDefinition, {
                industry: (industry?.toUpperCase() || 'ELEVATORS'),
                environment: 'PRODUCTION',
                tenantId,
                correlationId
            });

            if (!validation.valid) {
                throw new ValidationError('Generated workflow definition is invalid', {
                    errors: validation.errors,
                    warnings: validation.warnings,
                });
            }

            await logEvento({
                level: 'INFO',
                source: 'WORKFLOW_ORCHESTRATOR',
                action: 'PROPOSE_DEFINITION_SUCCESS',
                message: `Workflow definition proposed successfully: ${validated.name}`,
                tenantId,
                details: {
                    name: validated.name,
                    stateCount: validated.states.length,
                    transitionCount: validated.transitions.length,
                    warnings: validation.warnings.length
                },
                correlationId,
            });

            return workflowDefinition;
        } catch (error) {
            await logEvento({
                level: 'ERROR',
                source: 'WORKFLOW_ORCHESTRATOR',
                action: 'PROPOSE_DEFINITION_ERROR',
                message: `Error proposing workflow definition: ${error instanceof Error ? error.message : 'Unknown error'}`,
                tenantId,
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
                correlationId,
            });
            throw error;
        }
    }
}
