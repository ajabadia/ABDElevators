
import { z } from 'zod';

/**
 * ⚡ FASE 129: Standardized Checklist Schema
 * Defines the structure for static configurations and runtime snapshots.
 */

// --- 1. CONFIGURATION SCHEMAS (Templates) ---

export const ChecklistItemConfigSchema = z.object({
    id: z.string(), // Stable ID (e.g., 'visual_inspection_motor' or content-hash-based)
    category: z.string(), // Grouping (e.g., 'Safety', 'Mechanical')
    categoryId: z.string().optional(), // Alias for category used in some components
    label: z.string(),
    description: z.string().optional(),
    required: z.boolean().default(true),
    type: z.enum(['BOOLEAN', 'TEXT', 'PHOTO', 'NUMBER', 'SELECT']).default('BOOLEAN'),
    options: z.array(z.string()).optional(), // For SELECT type
    // Runtime fields used in DynamicChecklist
    confidenceLevel: z.string().optional(),
    ragReference: z.string().optional(),
    notes: z.string().optional(),
});

export const ChecklistConfigSchema = z.object({
    _id: z.any().optional(),
    id: z.string(), // Human readable ID (e.g., 'maintenance_monthly_v1')
    tenantId: z.string(),
    title: z.string(),
    name: z.string().optional(), // Alias for title used in some components
    description: z.string().optional(),
    version: z.number().default(1),
    items: z.array(ChecklistItemConfigSchema),
    categories: z.array(z.object({
        id: z.string(),
        name: z.string(),
        color: z.string().default('#64748b'),
        priority: z.number().default(0),
        keywords: z.array(z.string()).default([]),
    })).default([]),
    workflowOrder: z.array(z.string()).default([]),
    active: z.boolean().default(true),
    isActive: z.boolean().optional(), // Alias for active
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
});

// --- 2. RUNTIME SCHEMAS (Instances) ---

export const ValidationStatusSchema = z.enum([
    'PENDING',
    'APPROVED',
    'REJECTED',
    'NEEDS_CHANGES',
    'NOT_APPLICABLE'
]);

export const ItemValidationSchema = z.object({
    itemId: z.string(), // Refers to ChecklistItemConfigSchema.id (must be stable across extractions)
    status: ValidationStatusSchema.default('PENDING'),
    validationSource: z.enum(['HUMAN', 'AI', 'AUTO']).default('HUMAN'),
    value: z.any().optional(),
    comments: z.string().optional(),
    evidenceUrls: z.array(z.string()).optional(),
    validatedBy: z.string().optional(),
    validatedAt: z.coerce.date().optional(),
    aiConfidence: z.number().min(0).max(1).optional(),
});

export const ExtractedChecklistSchema = z.object({
    _id: z.any().optional(),
    entityId: z.string(), // Reference to the document/case
    checklistConfigId: z.string().optional(), // Template used (if any)
    version: z.number().optional().default(1),
    validations: z.array(ItemValidationSchema).default([]),
    overallStatus: ValidationStatusSchema.default('PENDING'),
    completionPercentage: z.number().min(0).max(100).default(0),
    metadata: z.record(z.string(), z.any()).default({}),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
});


export type ChecklistConfig = z.infer<typeof ChecklistConfigSchema>;
export type ChecklistItemConfig = z.infer<typeof ChecklistItemConfigSchema>;
export type ItemValidation = z.infer<typeof ItemValidationSchema>;
export type ExtractedChecklist = z.infer<typeof ExtractedChecklistSchema>;

// Compatibility Aliases for older components (Phase 128 compatibility)
export const ChecklistItemSchema = ChecklistItemConfigSchema;
export type ChecklistItem = ChecklistItemConfig;

export const ChecklistCategorySchema = z.object({
    id: z.string(),
    name: z.string(),
    color: z.string().default('#64748b'),
    priority: z.number().default(0),
    keywords: z.array(z.string()).default([]),
});
export type ChecklistCategory = z.infer<typeof ChecklistCategorySchema>;
