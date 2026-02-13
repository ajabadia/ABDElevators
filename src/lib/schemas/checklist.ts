
import { z } from 'zod';

/**
 * ⚡ FASE 129: Standardized Checklist Schema
 * Defines the structure for static configurations and runtime snapshots.
 */

// --- 1. CONFIGURATION SCHEMAS (Templates) ---

export const ChecklistItemConfigSchema = z.object({
    id: z.string(), // Stable ID (e.g., 'visual_inspection_motor')
    category: z.string(), // Grouping (e.g., 'Safety', 'Mechanical')
    label: z.string(),
    description: z.string().optional(),
    required: z.boolean().default(true),
    type: z.enum(['BOOLEAN', 'TEXT', 'PHOTO', 'NUMBER', 'SELECT']).default('BOOLEAN'),
    options: z.array(z.string()).optional(), // For SELECT type
});

export const ChecklistConfigSchema = z.object({
    _id: z.string().optional(),
    id: z.string(), // Human readable ID (e.g., 'maintenance_monthly_v1')
    tenantId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    version: z.number().default(1),
    items: z.array(ChecklistItemConfigSchema),
    active: z.boolean().default(true),
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
    itemId: z.string(), // Refers to ChecklistItemConfigSchema.id
    status: ValidationStatusSchema.default('PENDING'),
    value: z.any().optional(), // The actual input value (boolean, text response, etc.)
    comments: z.string().optional(),
    evidenceUrls: z.array(z.string()).optional(), // Photos/Docs
    validatedBy: z.string().optional(), // UserId
    validatedAt: z.coerce.date().optional(),
});

export const ExtractedChecklistSchema = z.object({
    checklistConfigId: z.string(), // Reference to the template
    version: z.number(), // Template version
    validations: z.array(ItemValidationSchema),
    overallStatus: ValidationStatusSchema.default('PENDING'),
    completionPercentage: z.number().default(0),
    metadata: z.record(z.string(), z.any()).default({}),
});

export type ChecklistConfig = z.infer<typeof ChecklistConfigSchema>;
export type ChecklistItemConfig = z.infer<typeof ChecklistItemConfigSchema>;
export type ItemValidation = z.infer<typeof ItemValidationSchema>;
export type ExtractedChecklist = z.infer<typeof ExtractedChecklistSchema>;
