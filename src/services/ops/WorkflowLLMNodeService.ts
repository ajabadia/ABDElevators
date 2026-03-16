import { z } from 'zod';
import { PromptService } from '@/services/llm/prompt-service';
import { PROMPTS } from '@/lib/prompts';
import { AppError } from '@/lib/errors';
import { callGeminiMini } from '@/services/llm/llm-service';
import { safeParseLlmJson } from '@/lib/safe-llm-json';
import { DEFAULT_MODEL } from '@abd/platform-core';
import { withCorrelation } from '@/lib/logger/with-correlation';

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
        llmNodeConfig: { promptKey?: string; schemaKey?: string; enabled: boolean };
        caseContext: Record<string, unknown> & { industry?: string };
        correlationId?: string;
    }): Promise<Record<string, unknown>> {
        const { tenantId, caseId, stateId, llmNodeConfig, caseContext, correlationId: cid } = params;

        return await withCorrelation(
            { level: 'INFO', source: 'WORKFLOW_LLM_NODE', action: 'NODE_EXECUTION', tenantId, correlationId: cid },
            async ({ log, correlationId }) => {
                if (!llmNodeConfig.enabled) {
                    await log({
                        level: 'WARN',
                        action: 'NODE_DISABLED',
                        message: `LLM node execution skipped as it is disabled for state ${stateId}`,
                        details: { caseId, stateId }
                    });
                    return {};
                }

                await log({
                    action: 'NODE_EXECUTION_START',
                    message: `Starting LLM node execution for case ${caseId} in state ${stateId}`,
                    details: { caseId, stateId, promptKey: llmNodeConfig.promptKey }
                });

                try {
                    // Get rendered prompt with fallback
                    let renderedPrompt: string;

                    try {
                        const { text, version } = await PromptService.getRenderedPrompt(
                            llmNodeConfig.promptKey || '',
                            {
                                caseContext: JSON.stringify(caseContext, null, 2),
                                currentState: stateId,
                                vertical: (caseContext.industry?.toUpperCase() || 'ELEVATORS'),
                            },
                            tenantId,
                            'PRODUCTION',
                            'GENERIC',
                            undefined,
                            'WORKFLOW_NODE'
                        );
                        renderedPrompt = text;
                    } catch (err) {
                        console.warn(`[WorkflowLLMNode] ⚠️ Fallback to Master Prompt for ${llmNodeConfig.promptKey}:`, err);
                        await log({
                            level: 'WARN',
                            action: 'PROMPT_FALLBACK',
                            message: `Using master fallback for ${llmNodeConfig.promptKey}`,
                            details: {
                                promptKey: llmNodeConfig.promptKey,
                                error: err instanceof Error ? err.message : 'Unknown error',
                            }
                        });

                        // Get master prompt from PROMPTS object
                        const masterPrompt = PROMPTS[llmNodeConfig.promptKey as keyof typeof PROMPTS];
                        if (!masterPrompt) {
                            throw new AppError('PROMPT_NOT_FOUND', 500, `Master prompt not found: ${llmNodeConfig.promptKey}`);
                        }

                        renderedPrompt = (masterPrompt?.template || '')
                            .replace(/{{caseContext}}/g, JSON.stringify(caseContext, null, 2))
                            .replace(/{{currentState}}/g, stateId)
                            .replace(/{{vertical}}/g, caseContext.industry || 'elevadores');
                    }

                    // Call LLM
                    const text = await callGeminiMini(
                        renderedPrompt,
                        tenantId,
                        { correlationId, temperature: 0.3, model: DEFAULT_MODEL }
                    );

                    // Parse and validate response using resilient utility
                    const validated = await safeParseLlmJson({
                        raw: text,
                        schema: LLMNodeOutputSchema,
                        source: 'WORKFLOW_LLM_NODE',
                        correlationId,
                        tenantId
                    });

                    await log({
                        action: 'NODE_EXECUTION_SUCCESS',
                        message: `LLM node execution successful for case ${caseId} result: risk=${validated.riskLevel}`,
                        details: {
                            caseId,
                            stateId,
                            riskLevel: validated.riskLevel,
                            confidence: validated.confidence,
                        }
                    });

                    // Log to AI audit trail
                    await log({
                        source: 'AI_AUDIT',
                        action: 'WORKFLOW_NODE_EXECUTED',
                        message: `AI Node executed: ${llmNodeConfig.promptKey}`,
                        details: {
                            caseId,
                            stateId,
                            promptKey: llmNodeConfig.promptKey,
                            output: validated,
                            rawOutputId: correlationId, // Reference for full trace
                        }
                    });

                    return validated as Record<string, unknown>;
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    await log({
                        level: 'ERROR',
                        action: 'NODE_EXECUTION_ERROR',
                        message: `Error executing LLM node: ${errorMessage}`,
                        details: {
                            caseId,
                            stateId,
                            error: errorMessage,
                        }
                    });

                    // ⚡ FASE 165.5: Return structured fallback instead of throwing
                    return {
                        riskLevel: 'MEDIUM',
                        confidence: 0,
                        reason: `LLM_FALLBACK: ${errorMessage}`,
                        detectedIssues: ['LLM_UNAVAILABLE'],
                        source: 'LLM_FALLBACK'
                    };
                }
            }
        );
    }

    /**
     * Routes to next state based on LLM decision
     */
    static async route(params: {
        tenantId: string;
        caseId: string;
        llmOutput: Record<string, unknown>;
        llmRouting: {
            promptKey: string;
            branches: Array<{ value: string; to: string; label: string }>
        };
        correlationId?: string;
    }): Promise<string> {
        const { tenantId, caseId, llmOutput, llmRouting, correlationId: cid } = params;

        return await withCorrelation(
            { level: 'INFO', source: 'WORKFLOW_LLM_ROUTER', action: 'ROUTING_DECISION', tenantId, correlationId: cid },
            async ({ log, correlationId }) => {
                await log({
                    action: 'ROUTING_START',
                    message: `Determining route for case ${caseId}`,
                    details: { caseId, branchCount: llmRouting.branches.length }
                });

                try {
                    // Simple routing based on LLM output fields
                    // Check if any branch value matches a field in llmOutput
                    for (const branch of llmRouting.branches) {
                        // Check if the branch value matches any field value in llmOutput
                        const matchingField = Object.entries(llmOutput).find(
                            ([, value]) => value === branch.value
                        );

                        if (matchingField) {
                            await log({
                                action: 'ROUTING_SUCCESS',
                                message: `Route matched successfully: ${branch.label}`,
                                details: {
                                    caseId,
                                    matchedBranch: branch.label,
                                    targetState: branch.to,
                                    matchedField: matchingField[0],
                                }
                            });

                            return branch.to;
                        }
                    }

                    // If no match found, check for nextBranch field
                    if (llmOutput.nextBranch && typeof llmOutput.nextBranch === 'string') {
                        const matchingBranch = llmRouting.branches.find(
                            b => b.value === llmOutput.nextBranch
                        );

                        if (matchingBranch) {
                            await log({
                                action: 'ROUTING_SUCCESS',
                                message: `Route matched via nextBranch: ${matchingBranch.label}`,
                                details: {
                                    caseId,
                                    matchedBranch: matchingBranch.label,
                                    targetState: matchingBranch.to,
                                }
                            });

                            return matchingBranch.to;
                        }
                    }

                    // No match found - use first branch as default
                    const defaultBranch = llmRouting.branches[0];

                    await log({
                        level: 'WARN',
                        action: 'ROUTING_DEFAULT',
                        message: `No route matched, using default: ${defaultBranch.label}`,
                        details: {
                            caseId,
                            defaultBranch: defaultBranch.label,
                            targetState: defaultBranch.to,
                            reason: 'No matching branch found in LLM output',
                        }
                    });

                    return defaultBranch.to;
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    await log({
                        level: 'ERROR',
                        action: 'ROUTING_ERROR',
                        message: `Error during routing decision: ${errorMessage}`,
                        details: {
                            caseId,
                            error: errorMessage,
                        }
                    });

                    // ⚡ FASE 165.5: Fallback to manual review (signaled by empty string or specific token)
                    return 'PENDING_MANUAL_REVIEW';
                }
            }
        );
    }
}
