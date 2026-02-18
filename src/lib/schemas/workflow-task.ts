
import { z } from 'zod';
import { UserRole } from '../../types/roles';

/**
 * ⚡ FASE 129: Standardized WorkflowTask Schema
 * Unifies task structure for AIWorkflowEngine and CaseWorkflowEngine.
 */

export const WorkflowTaskTypeSchema = z.enum([
    'DOCUMENT_REVIEW',
    'SECURITY_SIGNATURE',
    'TECHNICAL_VALIDATION',
    'COMPLIANCE_CHECK',
    'RISK_ASSESSMENT',
    'DATA_ENTRY',
    'WORKFLOW_DECISION' // ⚡ FASE 127: LLM-driven workflow decisions
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

// ⚡ FASE 127: LLM Proposal Schema for HITL
export const LLMProposalSchema = z.object({
    suggestedNextState: z.string().optional(),
    suggestedAction: z.enum(['APPROVE', 'REJECT', 'ESCALATE']).optional(),
    score: z.number().min(0).max(1).optional(),
    reason: z.string().optional(),
    rawOutputId: z.string().optional(), // Reference to full LLM output in logs

    // ⚡ FASE 82: Feedback & Learning
    humanCorrection: z.string().optional(), // Final state/action decided by human
    humanNotes: z.string().optional(), // Human notes specifically about the AI suggestion
    rejectionReason: z.string().optional(), // Concise rejection reason
    feedbackCategory: z.enum([
        'HALLUCINATION',
        'OUTDATED_DATA',
        'LOGIC_ERROR',
        'MISSING_CONTEXT',
        'OTHER'
    ]).optional(),
});

export const WorkflowTaskSchema = z.object({
    _id: z.string().optional(), // MongoDB ObjectIds are strings in JSON
    tenantId: z.string().min(1, "TenantId is required"),
    caseId: z.string().min(1, "CaseId/EntityId is required"),

    // Core Identity
    type: WorkflowTaskTypeSchema.default('DOCUMENT_REVIEW'),
    title: z.string().min(3, "Title must be at least 3 chars"),
    description: z.string().optional(),

    // Assignment
    assignedRole: z.nativeEnum(UserRole).default(UserRole.ADMIN),
    assignedUserId: z.string().optional(),

    // State
    status: WorkflowTaskStatusSchema.default('PENDING'),
    priority: WorkflowTaskPrioritySchema.default('MEDIUM'),

    // Context & Linkage
    metadata: z.object({
        workflowId: z.string().optional(),
        nodeLabel: z.string().optional(),
        correlationId: z.string().optional(),
        // ⚡ FASE 127: LLM Proposal for HITL
        llmProposal: LLMProposalSchema.optional(),
    }).catchall(z.any()).default({}), // Allow additional fields while enforcing structure
    checklistConfigId: z.string().optional(), // Link to granular checklist definitions

    // Aggregated Data (Optional)
    caseContext: z.any().optional(),


    // Lifecycle
    dueDate: z.coerce.date().optional(),
    completedAt: z.coerce.date().optional(),
    completedBy: z.string().optional(),

    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
});

export type WorkflowTask = z.infer<typeof WorkflowTaskSchema>;
export type WorkflowTaskType = z.infer<typeof WorkflowTaskTypeSchema>;
export type WorkflowTaskStatus = z.infer<typeof WorkflowTaskStatusSchema>;
