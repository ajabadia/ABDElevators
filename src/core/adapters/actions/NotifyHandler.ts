import { IActionHandler, WorkflowContext, ActionResult } from '../../domain/services/IActionHandler';
import { WorkflowAction } from '@/types/workflow';

export class NotifyHandler implements IActionHandler {
    type: WorkflowAction['type'] = 'notify';

    async execute(action: WorkflowAction, context: WorkflowContext): Promise<ActionResult> {
        const { triggerData } = context;
        console.log(`[WorkflowAction] NOTIFICACIÓN: ${action.params.message} `, triggerData);
        return { status: 'SUCCESS' };
    }
}
