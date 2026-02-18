import { IActionHandler, WorkflowContext, ActionResult } from '../../domain/services/IActionHandler';
import { WorkflowAction } from '@/types/workflow';
import { logEvento } from '@/lib/logger';

export class LogHandler implements IActionHandler {
    type: WorkflowAction['type'] = 'log';

    async execute(action: WorkflowAction, context: WorkflowContext): Promise<ActionResult> {
        const { correlationId, triggerData } = context;

        await logEvento({
            level: 'WARN',
            source: 'AI_AUTOMATION',
            action: 'AUTOMATED_ALERT',
            message: (action.params as any).message || 'Alerta automatizada detectada',
            correlationId,
            details: { triggerData }
        });

        return { status: 'SUCCESS' };
    }
}
