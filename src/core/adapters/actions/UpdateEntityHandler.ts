import { IActionHandler, WorkflowContext, ActionResult } from '../../domain/services/IActionHandler';
import { WorkflowAction } from '@/types/workflow';
import { ICaseWorkflowRepository } from '../../domain/repositories/ICaseWorkflowRepository';
import { GovernanceEngine } from '@/core/engine/GovernanceEngine';

export class UpdateEntityHandler implements IActionHandler {
    type: WorkflowAction['type'] = 'update_entity';

    constructor(private workflowRepo: ICaseWorkflowRepository) { }

    async execute(action: WorkflowAction, context: WorkflowContext): Promise<ActionResult> {
        try {
            const { tenantId, triggerData } = context;
            const { entitySlug, idField, updates } = action.params as any;

            // 1. Governance check
            const gov = GovernanceEngine.getInstance();
            const { canExecute } = await gov.evaluateAction(
                'WORKFLOW_ENGINE',
                entitySlug || '*',
                'update_entity',
                tenantId
            );

            if (!canExecute) {
                return { status: 'FAILED', errorMessage: 'Blocked by Governance Engine' };
            }

            // 2. Execution
            const id = triggerData[idField];
            if (id && entitySlug) {
                await this.workflowRepo.updateEntity(entitySlug, id, updates, tenantId);
                return { status: 'SUCCESS' };
            }

            return { status: 'FAILED', errorMessage: 'Missing ID or EntitySlug for update' };

        } catch (error: any) {
            return { status: 'FAILED', errorMessage: error.message };
        }
    }
}
