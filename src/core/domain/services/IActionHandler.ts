import { WorkflowAction } from '@/types/workflow';

export interface WorkflowContext {
    workflowId: string;
    tenantId: string;
    correlationId: string;
    triggerData: any;
}

export interface ActionResult {
    status: 'SUCCESS' | 'FAILED';
    errorMessage?: string;
    output?: any;
}

export interface IActionHandler {
    type: WorkflowAction['type'];
    execute(action: WorkflowAction, context: WorkflowContext): Promise<ActionResult>;
}
