import { z } from 'zod';
import { WorkflowDefinition, WorkflowDefinitionSchema } from '@/lib/schemas/workflow';
import { PromptService } from '@/lib/prompt-service';
import { PROMPTS } from '@/lib/prompts';
import { logEvento } from '@abd/platform-core/server';
import { safeParseLlmJson } from '@/lib/safe-llm-json';
import { ValidationError } from '@abd/platform-core';
import { callGeminiMini } from '@/lib/llm';
import { validateWorkflowDefinition } from '@/lib/workflow-definition-validator';
import {
    WorkflowSuggestionSchema,
    WorkflowProposalSchema,
    WorkflowSuggestion,
    WorkflowProposal
} from './schemas';


export class AIWorkflowOrchestrator {
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
            const workflowsSummary = existingWorkflows.map(w => ({
                id: w._id?.toString() || '',
                name: w.name,
                entityType: w.entityType,
                stateCount: w.states.length,
                states: w.states.map(s => s.label).join(' → '),
            }));

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
            } catch (err: any) {
                await logEvento({
                    level: 'WARN',
                    source: 'WORKFLOW_ORCHESTRATOR',
                    action: 'PROMPT_FALLBACK',
                    message: `Fallback to Master Prompt for WORKFLOW_ROUTER: ${err?.message || 'Unknown error'}`,
                    tenantId,
                    details: { error: err?.message || 'Unknown error' },
                    correlationId,
                });

                renderedPrompt = (PROMPTS.WORKFLOW_ROUTER?.template || '')
                    .replace(/{{vertical}}/g, industry || 'elevadores')
                    .replace(/{{existingWorkflows}}/g, JSON.stringify(workflowsSummary, null, 2))
                    .replace(/{{description}}/g, description)
                    .replace(/{{entityType}}/g, entityType)
                    .replace(/{{industry}}/g, industry || 'elevadores');
            }

            const text = await callGeminiMini(
                renderedPrompt,
                tenantId,
                { correlationId, temperature: 0.3, model: 'gemini-2.0-flash-exp' }
            );

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
        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'WORKFLOW_ORCHESTRATOR',
                action: 'SUGGEST_WORKFLOW_ERROR',
                message: `Error suggesting workflow: ${error?.message || 'Unknown error'}`,
                tenantId,
                details: { error: error?.message || 'Unknown error' },
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
            } catch (err: any) {
                await logEvento({
                    level: 'WARN',
                    source: 'WORKFLOW_ORCHESTRATOR',
                    action: 'PROMPT_FALLBACK',
                    message: `Fallback to Master Prompt for WORKFLOW_GENERATOR: ${err?.message || 'Unknown error'}`,
                    tenantId,
                    details: { error: err?.message || 'Unknown error' },
                    correlationId,
                });

                renderedPrompt = (PROMPTS.WORKFLOW_GENERATOR?.template || '')
                    .replace(/{{vertical}}/g, industry || 'elevadores')
                    .replace(/{{entityType}}/g, entityType)
                    .replace(/{{industry}}/g, industry || 'elevadores')
                    .replace(/{{description}}/g, description);
            }

            const text = await callGeminiMini(
                renderedPrompt,
                tenantId,
                { correlationId, temperature: 0.4, model: 'gemini-2.0-flash-exp' }
            );

            const validated = await safeParseLlmJson({
                raw: text,
                schema: WorkflowProposalSchema,
                source: 'WORKFLOW_ORCHESTRATOR',
                correlationId,
                tenantId
            });

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
                    probability: 1,
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
                status: 'draft' as const,
                environment: 'PRODUCTION' as const,
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

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
        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'WORKFLOW_ORCHESTRATOR',
                action: 'PROPOSE_DEFINITION_ERROR',
                message: `Error proposing workflow definition: ${error?.message || 'Unknown error'}`,
                tenantId,
                details: { error: error?.message || 'Unknown error' },
                correlationId,
            });
            throw error;
        }
    }
}
