import { IActionHandler, WorkflowContext, ActionResult } from '../../domain/services/IActionHandler';
import { WorkflowAction } from '@/types/workflow';

export class ActionHandlerRegistry {
    private handlers: Map<string, IActionHandler> = new Map();

    register(handler: IActionHandler) {
        this.handlers.set(handler.type, handler);
    }

    async getHandler(type: string): Promise<IActionHandler | undefined> {
        return this.handlers.get(type);
    }

    async executeAction(action: WorkflowAction, context: WorkflowContext): Promise<ActionResult> {
        const handler = this.handlers.get(action.type);
        if (!handler) {
            return { status: 'FAILED', errorMessage: `No handler found for action type: ${action.type}` };
        }
        return await handler.execute(action, context);
    }
}
