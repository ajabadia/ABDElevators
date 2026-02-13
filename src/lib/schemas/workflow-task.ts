
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
    'DATA_ENTRY'
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
    metadata: z.record(z.string(), z.any()).default({}), // Flexible metadata
    checklistConfigId: z.string().optional(), // Link to granular checklist definitions

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
