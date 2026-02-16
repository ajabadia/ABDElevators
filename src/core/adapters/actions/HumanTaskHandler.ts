import { IActionHandler, WorkflowContext, ActionResult } from '../../domain/services/IActionHandler';
import { WorkflowAction } from '@/types/workflow';
import { ICaseWorkflowRepository } from '../../domain/repositories/ICaseWorkflowRepository';
import { logEvento } from '@/lib/logger';

export class HumanTaskHandler implements IActionHandler {
    type: WorkflowAction['type'] = 'human_task';

    constructor(private workflowRepo: ICaseWorkflowRepository) { }

    async execute(action: WorkflowAction, context: WorkflowContext): Promise<ActionResult> {
        try {
            const { tenantId, correlationId, workflowId, triggerData } = context;

            const taskPayload = {
                tenantId,
                caseId: triggerData._id || triggerData.id || triggerData.caseId || 'unlinked-case',
                type: action.params.taskType || 'DOCUMENT_REVIEW',
                title: action.params.title || 'Validación requerida por Workflow',
                description: action.params.description || `Se requiere revisión humana para el flujo ${workflowId}. Motivo: ${triggerData.reason || 'Análisis RAG crítico'}`,
                assignedRole: action.params.assignedRole || 'ADMIN',
                status: 'PENDING',
                priority: action.params.priority || 'MEDIUM',
                metadata: {
                    correlationId,
                    workflowId,
                    triggerData,
                    nodeLabel: action.params.label,
                    checklistConfigId: action.params.checklistConfigId
                }
            };

            await this.workflowRepo.createTask(taskPayload);

            await logEvento({
                level: 'INFO',
                source: 'WORKFLOW_ACTION_HANDLER',
                action: 'HUMAN_TASK_CREATED',
                message: `Manual task generated for case ${taskPayload.caseId}`,
                correlationId,
                details: { workflowId, taskId: taskPayload.caseId }
            });

            return { status: 'SUCCESS' };
        } catch (error: any) {
            return { status: 'FAILED', errorMessage: error.message };
        }
    }
}
