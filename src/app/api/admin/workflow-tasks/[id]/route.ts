import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { WorkflowTaskService } from '@/services/ops/WorkflowTaskService';
import { CaseWorkflowEngine } from '@/core/engine/CaseWorkflowEngine';
import { AppError, handleApiError } from '@/lib/errors';
import { FeedbackService } from '@/services/support/FeedbackService';
import { logEvento } from '@/lib/logger';
import { z } from 'zod';
import { enforcePermission } from '@/lib/guardian-guard';

const UpdateStatusSchema = z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED']),
    notes: z.string().optional(),
    decision: z.enum(['ACCEPT', 'OVERRIDE']).optional(),
    chosenNextState: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    feedbackCategory: z.string().optional(),
    rejectionReason: z.string().optional(),
});

async function PATCH_internal(
    req: NextRequest,
    context: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('technical:analysis', 'write');
        const { id } = context.params;

        const body = await req.json();
        const validated = UpdateStatusSchema.parse(body);

        const result = await WorkflowTaskService.updateStatus({
            id, tenantId: session.user.tenantId, userId: session.user.id,
            userName: session.user.name || session.user.email || 'Unknown',
            status: validated.status, notes: validated.notes, metadata: validated.metadata,
            correlationId
        });

        if (['COMPLETED', 'REJECTED'].includes(validated.status) && result.task.metadata?.llmProposal) {
            const proposal = result.task.metadata.llmProposal;
            const humanDecision = validated.decision || (validated.status === 'COMPLETED' ? 'ACCEPT' : 'REJECT');
            await FeedbackService.recordFeedback({
                taskId: id, workflowId: result.task.metadata.workflowId, nodeLabel: result.task.metadata.nodeLabel,
                modelSuggestion: proposal.suggestedAction || proposal.suggestedNextState,
                humanDecision: validated.chosenNextState || humanDecision,
                category: validated.feedbackCategory, rejectionReason: validated.rejectionReason || validated.notes,
                correlationId
            }, correlationId);
        }

        if (validated.status === 'COMPLETED' && result.task?.type === 'WORKFLOW_DECISION') {
            const { decision, chosenNextState } = validated;
            if (!decision) throw new AppError('VALIDATION_ERROR', 400, 'Decision required');
            if (decision === 'OVERRIDE' && !chosenNextState) throw new AppError('VALIDATION_ERROR', 400, 'Next state required for override');

            const finalState = decision === 'ACCEPT' ? result.task.metadata?.llmProposal?.suggestedNextState : chosenNextState;
            if (!finalState) throw new AppError('VALIDATION_ERROR', 400, 'Cannot determine next state');

            const transitionResult = await CaseWorkflowEngine.getInstance().executeTransition(
                result.task.caseId, finalState, session.user.tenantId, session.user.id, [session.user.role], correlationId
            );

            if (!transitionResult.success) throw new AppError('TRANSITION_ERROR', 500, transitionResult.error);

            return NextResponse.json({ ...result, transitionExecuted: true, newCaseState: transitionResult.newState });
        }

        return NextResponse.json(result);
    } catch (error: unknown) {
        return handleApiError(error, 'API_WORKFLOW_TASK_PATCH', correlationId);
    }
}

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/admin/workflow-tasks/[id]', thresholdMs: 1000 });
