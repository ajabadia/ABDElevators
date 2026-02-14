/**
 * ⚡ FASE 127: Intelligent Workflow Orchestration
 * WorkflowLLMNodeService - Execute LLM nodes within workflow states
 */

import { z } from 'zod';
import { PromptService } from './prompt-service';
import { PROMPTS } from './prompts';
import { logEvento } from './logger';
import { AppError } from './errors';
import { callGeminiMini } from './llm';

// Generic LLM Node Output Schema
const LLMNodeOutputSchema = z.object({
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    nextBranch: z.string().optional(),
    confidence: z.number().min(0).max(1),
    reason: z.string(),
    detectedIssues: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
}).catchall(z.any()); // Allow additional fields from custom schemas

export type LLMNodeOutput = z.infer<typeof LLMNodeOutputSchema>;

export class WorkflowLLMNodeService {
    /**
     * Executes an LLM node and returns structured data
     */
    static async runNode(params: {
        tenantId: string;
        caseId: string;
        stateId: string;
        llmNodeConfig: { promptKey: string; schemaKey: string; enabled: boolean };
        caseContext: any;
        correlationId: string;
    }): Promise<Record<string, any>> {
        const { tenantId, caseId, stateId, llmNodeConfig, caseContext, correlationId } = params;

        if (!llmNodeConfig.enabled) {
            await logEvento({
                level: 'WARN',
                source: 'WORKFLOW_LLM_NODE',
                action: 'NODE_DISABLED',
                message: `LLM node execution skipped as it is disabled for state ${stateId}`,
                tenantId,
                details: { caseId, stateId },
                correlationId,
            });
            return {};
        }

        await logEvento({
            level: 'INFO',
            source: 'WORKFLOW_LLM_NODE',
            action: 'NODE_EXECUTION_START',
            message: `Starting LLM node execution for case ${caseId} in state ${stateId}`,
            tenantId,
            details: { caseId, stateId, promptKey: llmNodeConfig.promptKey },
            correlationId,
        });

        try {
            // Get rendered prompt with fallback
            let renderedPrompt: string;

            try {
                const { text } = await PromptService.getRenderedPrompt(
                    llmNodeConfig.promptKey,
                    {
                        caseContext: JSON.stringify(caseContext, null, 2),
                        currentState: stateId,
                        vertical: (caseContext.industry?.toUpperCase() || 'ELEVATORS'),
                    },
                    tenantId
                );
                renderedPrompt = text;
            } catch (err) {
                console.warn(`[WorkflowLLMNode] ⚠️ Fallback to Master Prompt for ${llmNodeConfig.promptKey}:`, err);
                await logEvento({
                    level: 'WARN',
                    source: 'WORKFLOW_LLM_NODE',
                    action: 'PROMPT_FALLBACK',
                    message: `Using master fallback for ${llmNodeConfig.promptKey}`,
                    tenantId,
                    details: {
                        promptKey: llmNodeConfig.promptKey,
                        error: err instanceof Error ? err.message : 'Unknown error',
                    },
                    correlationId,
                });

                // Get master prompt from PROMPTS object
                const masterPrompt = PROMPTS[llmNodeConfig.promptKey as keyof typeof PROMPTS];
                if (!masterPrompt) {
                    throw new AppError('PROMPT_NOT_FOUND', 500, `Master prompt not found: ${llmNodeConfig.promptKey}`);
                }

                renderedPrompt = masterPrompt
                    .replace(/{{caseContext}}/g, JSON.stringify(caseContext, null, 2))
                    .replace(/{{currentState}}/g, stateId)
                    .replace(/{{vertical}}/g, caseContext.industry || 'elevadores');
            }

            // Call LLM
            const text = await callGeminiMini(
                renderedPrompt,
                tenantId,
                { correlationId, temperature: 0.3, model: 'gemini-2.0-flash-exp' }
            );

            // Parse JSON response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new AppError('LLM_INVALID_RESPONSE', 500, 'LLM did not return valid JSON');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Validate with generic schema (custom schemas can be added later)
            const validated = LLMNodeOutputSchema.parse(parsed);

            await logEvento({
                level: 'INFO',
                source: 'WORKFLOW_LLM_NODE',
                action: 'NODE_EXECUTION_SUCCESS',
                message: `LLM node execution successful for case ${caseId} result: risk=${validated.riskLevel}`,
                tenantId,
                details: {
                    caseId,
                    stateId,
                    riskLevel: validated.riskLevel,
                    confidence: validated.confidence,
                },
                correlationId,
            });

            // Log to AI audit trail
            await logEvento({
                level: 'INFO',
                source: 'AI_AUDIT',
                action: 'WORKFLOW_NODE_EXECUTED',
                message: `AI Node executed: ${llmNodeConfig.promptKey}`,
                tenantId,
                details: {
                    caseId,
                    stateId,
                    promptKey: llmNodeConfig.promptKey,
                    output: validated,
                    rawOutputId: correlationId, // Reference for full trace
                },
                correlationId,
            });

            return validated;
        } catch (error) {
            await logEvento({
                level: 'ERROR',
                source: 'WORKFLOW_LLM_NODE',
                action: 'NODE_EXECUTION_ERROR',
                message: `Error executing LLM node: ${error instanceof Error ? error.message : 'Unknown error'}`,
                tenantId,
                details: {
                    caseId,
                    stateId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
                correlationId,
            });
            throw error;
        }
    }

    /**
     * Routes to next state based on LLM decision
     */
    static async route(params: {
        tenantId: string;
        caseId: string;
        llmOutput: Record<string, any>;
        llmRouting: {
            promptKey: string;
            branches: Array<{ value: string; to: string; label: string }>
        };
        correlationId: string;
    }): Promise<string> {
        const { tenantId, caseId, llmOutput, llmRouting, correlationId } = params;

        await logEvento({
            level: 'INFO',
            source: 'WORKFLOW_LLM_ROUTER',
            action: 'ROUTING_START',
            message: `Determining route for case ${caseId}`,
            tenantId,
            details: { caseId, branchCount: llmRouting.branches.length },
            correlationId,
        });

        try {
            // Simple routing based on LLM output fields
            // Check if any branch value matches a field in llmOutput
            for (const branch of llmRouting.branches) {
                // Check if the branch value matches any field value in llmOutput
                const matchingField = Object.entries(llmOutput).find(
                    ([key, value]) => value === branch.value
                );

                if (matchingField) {
                    await logEvento({
                        level: 'INFO',
                        source: 'WORKFLOW_LLM_ROUTER',
                        action: 'ROUTING_SUCCESS',
                        message: `Route matched successfully: ${branch.label}`,
                        tenantId,
                        details: {
                            caseId,
                            matchedBranch: branch.label,
                            targetState: branch.to,
                            matchedField: matchingField[0],
                        },
                        correlationId,
                    });

                    return branch.to;
                }
            }

            // If no match found, check for nextBranch field
            if (llmOutput.nextBranch) {
                const matchingBranch = llmRouting.branches.find(
                    b => b.value === llmOutput.nextBranch
                );

                if (matchingBranch) {
                    await logEvento({
                        level: 'INFO',
                        source: 'WORKFLOW_LLM_ROUTER',
                        action: 'ROUTING_SUCCESS',
                        message: `Route matched via nextBranch: ${matchingBranch.label}`,
                        tenantId,
                        details: {
                            caseId,
                            matchedBranch: matchingBranch.label,
                            targetState: matchingBranch.to,
                        },
                        correlationId,
                    });

                    return matchingBranch.to;
                }
            }

            // No match found - use first branch as default
            const defaultBranch = llmRouting.branches[0];

            await logEvento({
                level: 'WARN',
                source: 'WORKFLOW_LLM_ROUTER',
                action: 'ROUTING_DEFAULT',
                message: `No route matched, using default: ${defaultBranch.label}`,
                tenantId,
                details: {
                    caseId,
                    defaultBranch: defaultBranch.label,
                    targetState: defaultBranch.to,
                    reason: 'No matching branch found in LLM output',
                },
                correlationId,
            });

            return defaultBranch.to;
        } catch (error) {
            await logEvento({
                level: 'ERROR',
                source: 'WORKFLOW_LLM_ROUTER',
                action: 'ROUTING_ERROR',
                message: `Error during routing decision: ${error instanceof Error ? error.message : 'Unknown error'}`,
                tenantId,
                details: {
                    caseId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
                correlationId,
            });
            throw error;
        }
    }
}
