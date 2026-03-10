import { z } from 'zod';
import { EntityIdSchema } from '@/lib/schemas/common';

/**
 * 🌊 ERA 12: RELATIONAL INTEGRITY
 * Workflow Execution Schema
 * Tracks the lifecycle of industrial workflows.
 */
export const WorkflowExecutionSchema = z.object({
    _id: EntityIdSchema.optional(),
    tenantId: EntityIdSchema,
    userId: EntityIdSchema.optional(),
    workflowId: EntityIdSchema, // Reference to workflow definition
    executionId: z.string().uuid(),

    status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']),

    steps: z.array(z.object({
        stepId: z.string(),
        action: z.string(),
        status: z.enum(['SUCCESS', 'ERROR']),
        durationMs: z.number().optional(),
        error: z.string().optional(),
        result: z.unknown().optional(),
    })).default([]),

    triggerSource: z.enum(['MANUAL', 'SCHEDULE', 'WEBHOOK', 'EVENT']).default('MANUAL'),

    correlationId: z.string().uuid(),

    startedAt: z.date().default(() => new Date()),
    finishedAt: z.date().optional(),

    durationMs: z.number().optional(),
});

export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;
