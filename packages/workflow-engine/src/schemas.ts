
import { z } from 'zod';
import { UserRole } from '@abd/platform-core/server';

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

export const WorkflowTaskSchema = z.object({
    _id: z.string().optional(),
    tenantId: z.string().min(1, "TenantId is required"),
    caseId: z.string().min(1, "CaseId/EntityId is required"),
    type: WorkflowTaskTypeSchema.default('DOCUMENT_REVIEW'),
    title: z.string().min(3, "Title must be at least 3 chars"),
    description: z.string().optional(),
    assignedRole: z.nativeEnum(UserRole).default(UserRole.ADMIN),
    assignedUserId: z.string().optional(),
    status: WorkflowTaskStatusSchema.default('PENDING'),
    priority: WorkflowTaskPrioritySchema.default('MEDIUM'),
    metadata: z.object({
        workflowId: z.string().optional(),
        nodeLabel: z.string().optional(),
        correlationId: z.string().optional(),
        llmProposal: LLMProposalSchema.optional(),
    }).catchall(z.any()).default({}),
    checklistConfigId: z.string().optional(),
    caseContext: z.any().optional(),
    dueDate: z.coerce.date().optional(),
    completedAt: z.coerce.date().optional(),
    completedBy: z.string().optional(),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
});

export type WorkflowTask = z.infer<typeof WorkflowTaskSchema>;
export type WorkflowTaskType = z.infer<typeof WorkflowTaskTypeSchema>;
export type WorkflowTaskStatus = z.infer<typeof WorkflowTaskStatusSchema>;
