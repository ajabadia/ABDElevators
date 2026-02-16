import { IActionHandler, WorkflowContext, ActionResult } from '../../domain/services/IActionHandler';
import { WorkflowAction } from '@/types/workflow';
import { logEvento } from '@/lib/logger';

export class NotifyHandler implements IActionHandler {
    type: WorkflowAction['type'] = 'notify';

    async execute(action: WorkflowAction, context: WorkflowContext): Promise<ActionResult> {
        const { triggerData } = context;
        await logEvento({
            level: 'INFO',
            source: 'NOTIFY_HANDLER',
            action: 'NOTIFICATION_SENT',
            message: `Notification sent to ${action.params.recipient}`,
            correlationId: context.correlationId,
            tenantId: context.tenantId,
            details: action.params
        });
        return { status: 'SUCCESS' };
    }
}
