import { z } from 'zod';

export const WorkflowTriggerTypeSchema = z.enum([
    'on_insight',
    'on_prediction',
    'on_entity_change',
    'on_risk',
    'on_event'
]);
export type WorkflowTriggerType = z.infer<typeof WorkflowTriggerTypeSchema>;
export const WorkflowTriggerType = WorkflowTriggerTypeSchema.enum;

export const WorkflowActionTypeSchema = z.enum([
    'notify',
    'log',
    'update_entity',
    'external_webhook',
    'branch',
    'delay',
    'iterator',
    'human_task'
]);
export type WorkflowActionType = z.infer<typeof WorkflowActionTypeSchema>;
export const WorkflowActionType = WorkflowActionTypeSchema.enum;

export const WorkflowTriggerSchema = z.object({
    type: WorkflowTriggerTypeSchema,
    nodeId: z.string().optional(),
    condition: z.object({
        field: z.string(),
        operator: z.enum(['gt', 'lt', 'eq', 'contains']),
        value: z.any()
    })
});
export type WorkflowTrigger = z.infer<typeof WorkflowTriggerSchema>;

export const WorkflowActionSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('notify'), nodeId: z.string().optional(), params: z.record(z.string(), z.any()) }),
    z.object({ type: z.literal('log'), nodeId: z.string().optional(), params: z.record(z.string(), z.any()) }),
    z.object({ type: z.literal('update_entity'), nodeId: z.string().optional(), params: z.record(z.string(), z.any()) }),
    z.object({ type: z.literal('external_webhook'), nodeId: z.string().optional(), params: z.record(z.string(), z.any()) }),
    z.object({ type: z.literal('branch'), nodeId: z.string().optional(), params: z.record(z.string(), z.any()), outputPath: z.string().optional() }),
    z.object({ type: z.literal('delay'), nodeId: z.string().optional(), params: z.record(z.string(), z.any()) }),
    z.object({ type: z.literal('iterator'), nodeId: z.string().optional(), params: z.record(z.string(), z.any()) }),
    z.object({
        type: z.literal('human_task'),
        nodeId: z.string().optional(),
        params: z.object({
            title: z.string(),
            description: z.string().optional(),
            taskType: z.string().optional(),
            assignedRole: z.string().optional(),
            priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
            checklistConfigId: z.string().optional()
        })
    })
]);
export type WorkflowAction = z.infer<typeof WorkflowActionSchema>;

export const AIWorkflowSchema = z.object({
    id: z.string(),
    _id: z.any().optional(), // For MongoDB compatibility
    name: z.string(),
    trigger: WorkflowTriggerSchema,
    actions: z.array(WorkflowActionSchema),
    active: z.boolean().default(true),
    tenantId: z.string(),
    industry: z.string().optional(),
    environment: z.string().optional(),
    version: z.number().optional()
});
export type AIWorkflow = z.infer<typeof AIWorkflowSchema>;
