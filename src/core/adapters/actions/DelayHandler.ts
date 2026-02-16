import { IActionHandler, WorkflowContext, ActionResult } from '../../domain/services/IActionHandler';
import { WorkflowAction } from '@/types/workflow';
import { logEvento } from '@/lib/logger';

export class DelayHandler implements IActionHandler {
    type: WorkflowAction['type'] = 'delay';

    async execute(action: WorkflowAction, context: WorkflowContext): Promise<ActionResult> {
        const duration = Number(action.params.duration) || 1000;
        const unit = action.params.unit || 'ms';
        const ms = unit === 's' ? duration * 1000 : unit === 'm' ? duration * 60000 : duration;

        await logEvento({
            level: 'INFO',
            source: 'DELAY_HANDLER',
            action: 'DELAY_PROCESSED',
            message: `Delay processed: ${action.params.duration}ms`,
            correlationId: context.correlationId,
            tenantId: context.tenantId
        });
        await new Promise(resolve => setTimeout(resolve, ms));

        return { status: 'SUCCESS' };
    }
}
