import { z } from 'zod';
import { EntityIdSchema, TenantIdSchema } from './common';

/**
 * 🤖 AI WORKFLOW SCHEMAS
 * Standardized validation for automated cross-vertical triggers.
 */

export const AIWorkflowTriggerSchema = z.object({
    type: z.string().min(1),
    condition: z.object({
        field: z.string().min(1),
        operator: z.string().min(1),
        value: z.any()
    })
});

export const AIWorkflowActionSchema = z.object({
    type: z.string().min(1),
    params: z.record(z.string(), z.any()).default({})
});

export const AIWorkflowSchema = z.object({
    _id: EntityIdSchema.optional(),
    name: z.string().min(3),
    active: z.boolean().default(true),
    trigger: AIWorkflowTriggerSchema,
    actions: z.array(AIWorkflowActionSchema).min(1),
    tenantId: TenantIdSchema,
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

export type AIWorkflowTrigger = z.infer<typeof AIWorkflowTriggerSchema>;
export type AIWorkflowAction = z.infer<typeof AIWorkflowActionSchema>;
export type AIWorkflow = z.infer<typeof AIWorkflowSchema>;
