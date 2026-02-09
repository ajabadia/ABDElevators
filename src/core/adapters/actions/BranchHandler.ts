import { IActionHandler, WorkflowContext, ActionResult } from '../../domain/services/IActionHandler';
import { WorkflowAction } from '@/types/workflow';

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
            console.log(`[WorkflowEngine] Branching: LOW CONFIDENCE path detected (${confidence} < ${threshold})`);
        } else if (risk > 75 || String(action.params.label).toLowerCase().includes('critical')) {
            console.log(`[WorkflowEngine] Branching: CRITICAL path taken for ${workflowId}`);
        }

        return { status: 'SUCCESS' };
    }
}
