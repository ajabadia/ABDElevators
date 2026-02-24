import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowTaskService } from '@/services/ops/WorkflowTaskService';
import { CaseWorkflowEngine } from '@/core/engine/CaseWorkflowEngine';
import { AppError, handleApiError } from '@/lib/errors';
import { FeedbackService } from '@/services/support/FeedbackService';
import { logEvento } from '@/lib/logger';
import { z } from 'zod';
import crypto from 'crypto';

const UpdateStatusSchema = z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED']),
    notes: z.string().optional(),
    // ⚡ FASE 127: HITL Decision Parameters
    decision: z.enum(['ACCEPT', 'OVERRIDE']).optional(),
    chosenNextState: z.string().optional(), // Required if decision === 'OVERRIDE'
    metadata: z.record(z.string(), z.any()).optional(), // ⚡ FASE 128.3: Allow dynamic metadata update

    // ⚡ FASE 82: Feedback for AI
    feedbackCategory: z.string().optional(),
    rejectionReason: z.string().optional(),
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id } = await params;

        const body = await req.json();
        const validated = UpdateStatusSchema.parse(body);

        const result = await WorkflowTaskService.updateStatus({
            id,
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || session.user.email || 'Unknown User',
            status: validated.status,
            notes: validated.notes,
            metadata: validated.metadata,
            correlationId
        });

        // ⚡ FASE 82: Record AI Feedback if there's a proposal and task is finished
        if (['COMPLETED', 'REJECTED'].includes(validated.status) && result.task.metadata?.llmProposal) {
            const proposal = result.task.metadata.llmProposal;
            const humanDecision = validated.decision || (validated.status === 'COMPLETED' ? 'ACCEPT' : 'REJECT');

            // Record feedback only if it's a significant decision task or explicitly overridden
            await FeedbackService.recordFeedback({
                taskId: id,
                workflowId: result.task.metadata.workflowId,
                nodeLabel: result.task.metadata.nodeLabel,
                modelSuggestion: proposal.suggestedAction || proposal.suggestedNextState,
                humanDecision: validated.chosenNextState || humanDecision,
                category: validated.feedbackCategory,
                rejectionReason: validated.rejectionReason || validated.notes,
                correlationId
            }, correlationId);
        }

        // ⚡ FASE 127: Handle HITL Decision for WORKFLOW_DECISION tasks
        if (validated.status === 'COMPLETED' && result.task?.type === 'WORKFLOW_DECISION') {
            const { decision, chosenNextState } = validated;

            // Validate decision parameters
            if (!decision) {
                throw new AppError('VALIDATION_ERROR', 400, 'Decision is required for WORKFLOW_DECISION tasks');
            }

            if (decision === 'OVERRIDE' && !chosenNextState) {
                throw new AppError('VALIDATION_ERROR', 400, 'chosenNextState is required when overriding LLM suggestion');
            }

            // Get suggested state from LLM proposal
            const suggestedState = result.task.metadata?.llmProposal?.suggestedNextState;
            const finalState = decision === 'ACCEPT' ? suggestedState : chosenNextState;

            if (!finalState) {
                throw new AppError('VALIDATION_ERROR', 400, 'Cannot determine next state for transition');
            }

            await logEvento({
                level: 'INFO',
                source: 'API_WORKFLOW_TASK_PATCH',
                action: 'HITL_DECISION_MADE',
                message: `HITL Decision: ${decision} for task ${id}`,
                tenantId: session.user.tenantId,
                details: {
                    taskId: id,
                    caseId: result.task.caseId,
                    decision,
                    suggestedState,
                    finalState,
                    userId: session.user.id,
                },
                correlationId,
            });

            // Execute case transition
            const engine = CaseWorkflowEngine.getInstance();
            const transitionResult = await engine.executeTransition(
                result.task.caseId,
                finalState,
                session.user.tenantId,
                session.user.id,
                [session.user.role],
                correlationId
            );

            if (!transitionResult.success) {
                await logEvento({
                    level: 'ERROR',
                    source: 'API_WORKFLOW_TASK_PATCH',
                    action: 'HITL_TRANSITION_FAILED',
                    message: transitionResult.error || 'Unknown error',
                    tenantId: session.user.tenantId,
                    details: { taskId: id, caseId: result.task.caseId, finalState },
                    correlationId,
                });

                throw new AppError('TRANSITION_ERROR', 500, `Failed to transition case: ${transitionResult.error}`);
            }

            await logEvento({
                level: 'INFO',
                source: 'API_WORKFLOW_TASK_PATCH',
                action: 'HITL_TRANSITION_SUCCESS',
                message: `HITL Transition successful for case ${result.task.caseId} to ${transitionResult.newState}`,
                tenantId: session.user.tenantId,
                details: {
                    taskId: id,
                    caseId: result.task.caseId,
                    newState: transitionResult.newState,
                    decision,
                },
                correlationId,
            });

            return NextResponse.json({
                ...result,
                transitionExecuted: true,
                newCaseState: transitionResult.newState,
            });
        }

        return NextResponse.json(result);

    } catch (error: any) {
        return handleApiError(error, 'API_WORKFLOW_TASK_PATCH', correlationId);
    }
}
