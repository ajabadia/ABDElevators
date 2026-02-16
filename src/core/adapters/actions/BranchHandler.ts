import { IActionHandler, WorkflowContext, ActionResult } from '../../domain/services/IActionHandler';
import { WorkflowAction } from '@/types/workflow';
import { logEvento } from '@/lib/logger';

export class BranchHandler implements IActionHandler {
    type: WorkflowAction['type'] = 'branch';

    async execute(action: WorkflowAction, context: WorkflowContext): Promise<ActionResult> {
        const { triggerData, workflowId } = context;
        const criteria = action.params.criteria || {};
        const risk = triggerData.riskScore || triggerData.score || 0;
        const confidence = triggerData.confidenceScore || 1;

        // RAG-Driven: evaluate confidence if present
        const threshold = criteria.confidenceThreshold || 0.7;

        if (confidence < threshold) {
            await logEvento({
                level: 'INFO',
                source: 'BRANCH_HANDLER',
                action: 'BRANCH_EVALUATED',
                message: `Branch evaluated: Low Confidence`,
                correlationId: context.correlationId,
                tenantId: context.tenantId
            });
        } else if (risk > 75 || String(action.params.label).toLowerCase().includes('critical')) {
            await logEvento({
                level: 'INFO',
                source: 'BRANCH_HANDLER',
                action: 'BRANCH_EVALUATED',
                message: `Branch evaluated: Critical Path`,
                correlationId: context.correlationId,
                tenantId: context.tenantId
            });
        }

        return { status: 'SUCCESS' };
    }
}
