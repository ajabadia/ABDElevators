
import { z } from 'zod';
import { UserRole, EntityIdSchema, TenantIdSchema } from '@abd/platform-core';

/**
 * Standardized WorkflowTask Schema
 * Unifies task structure for AIWorkflowEngine and CaseWorkflowEngine.
 */

export const WorkflowTaskTypeSchema = z.enum([
    'DOCUMENT_REVIEW',
    'SECURITY_SIGNATURE',
    'TECHNICAL_VALIDATION',
    'COMPLIANCE_CHECK',
    'RISK_ASSESSMENT',
    'DATA_ENTRY',
    'WORKFLOW_DECISION'
]);

export const WorkflowTaskStatusSchema = z.enum([
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'REJECTED',
    'CANCELLED'
]);

export const WorkflowTaskPrioritySchema = z.enum([
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
]);

export const LLMProposalSchema = z.object({
    suggestedNextState: z.string().optional(),
    suggestedAction: z.enum(['APPROVE', 'REJECT', 'ESCALATE']).optional(),
    score: z.number().min(0).max(1).optional(),
    reason: z.string().optional(),
    rawOutputId: z.string().optional(),
    humanCorrection: z.string().optional(),
    humanNotes: z.string().optional(),
    rejectionReason: z.string().optional(),
    feedbackCategory: z.enum([
        'HALLUCINATION',
        'OUTDATED_DATA',
        'LOGIC_ERROR',
        'MISSING_CONTEXT',
        'OTHER'
    ]).optional(),
});

/**
 * 🆕 NUEVO: WorkflowExecutionSchema (Isla 3)
 * tracks individual workflow runs.
 */
export const WorkflowExecutionSchema = z.object({
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema,
    workflowId: EntityIdSchema,
    entityId: EntityIdSchema, // Reference to the case/asset/user being processed
    status: z.enum(['RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PAUSED']).default('RUNNING'),
    currentState: z.string(),
    context: z.record(z.string(), z.any()).default({}),
    history: z.array(z.object({
        state: z.string(),
        transitionedAt: z.date(),
        transitionedBy: EntityIdSchema.optional(),
        action: z.string().optional(),
        comment: z.string().optional()
    })).default([]),
    startedAt: z.date().default(() => new Date()),
    completedAt: z.date().optional(),
    startedBy: EntityIdSchema,
});

export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;

export const WorkflowTaskSchema = z.object({
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema,
    caseId: EntityIdSchema, // Reference to the entity
    executionId: EntityIdSchema.optional(), // Link to execution (Isla 3)
    type: WorkflowTaskTypeSchema.default('DOCUMENT_REVIEW'),
    title: z.string().min(3, "Title must be at least 3 chars"),
    description: z.string().optional(),
    assignedRole: z.nativeEnum(UserRole).default(UserRole.ADMIN),
    assignedUserId: EntityIdSchema.optional(),
    status: WorkflowTaskStatusSchema.default('PENDING'),
    priority: WorkflowTaskPrioritySchema.default('MEDIUM'),
    metadata: z.object({
        workflowId: EntityIdSchema.optional(),
        nodeLabel: z.string().optional(),
        correlationId: z.string().optional(),
        llmProposal: LLMProposalSchema.optional(),
    }).catchall(z.any()).default({}),
    checklistConfigId: EntityIdSchema.optional(),
    caseContext: z.any().optional(),
    dueDate: z.coerce.date().optional(),
    completedAt: z.coerce.date().optional(),
    completedBy: EntityIdSchema.optional(),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
});

export type WorkflowTask = z.infer<typeof WorkflowTaskSchema>;
export type WorkflowTaskType = z.infer<typeof WorkflowTaskTypeSchema>;
export type WorkflowTaskStatus = z.infer<typeof WorkflowTaskStatusSchema>;

// Phase 207: AI Orchestration types (browser-safe schemas)
export const WorkflowSuggestionSchema = z.object({
    action: z.enum(['USE_EXISTING', 'PROPOSE_NEW']),
    workflowId: EntityIdSchema.optional(),
    reason: z.string(),
    confidence: z.number().min(0).max(1).transform(v => Math.round(v * 100) / 100),
});

export const WorkflowProposalSchema = z.object({
    name: z.string(),
    entityType: z.enum(['ENTITY', 'EQUIPMENT', 'USER']),
    states: z.array(z.object({
        id: z.string(),
        label: z.string(),
        color: z.string().optional(),
        icon: z.string().optional(),
        is_initial: z.boolean(),
        is_final: z.boolean(),
        can_edit: z.boolean().optional(),
        requires_validation: z.boolean().optional(),
        roles_allowed: z.array(z.string()).optional(),
    })),
    transitions: z.array(z.object({
        from: z.string(),
        to: z.string(),
        label: z.string(),
        required_role: z.array(z.string()).optional(),
        conditions: z.object({
            checklist_complete: z.boolean().optional(),
            min_documents: z.number().optional(),
            require_signature: z.boolean().optional(),
            require_comment: z.boolean().optional(),
        }).optional(),
        actions: z.array(z.string()).optional(),
    })),
    initial_state: z.string(),
});

export type WorkflowSuggestion = z.infer<typeof WorkflowSuggestionSchema>;
export type WorkflowProposal = z.infer<typeof WorkflowProposalSchema>;
