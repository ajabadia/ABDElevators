import { z } from 'zod';
import { IndustryTypeSchema } from './core';
import { WorkflowLogSchema } from './workflow';

/**
 * 🏢 Business Logic & Asset Schemas
 */

export const RiskFindingSchema = z.object({
    id: z.string(),
    type: z.enum(['SECURITY', 'COMPATIBILITY', 'LEGAL', 'REGULATORY', 'GENERAL']),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    message: z.string(),
    ragReference: z.string().optional(),
    suggestion: z.string().optional(),
});
export type RiskFinding = z.infer<typeof RiskFindingSchema>;

export const GenericCaseSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    industry: IndustryTypeSchema,
    type: z.string(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    status: z.string(),
    metadata: z.object({
        industry_specific: z.record(z.string(), z.any()),
        taxonomies: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
        tags: z.array(z.string()),
        risks: z.array(RiskFindingSchema).optional(), // Hallazgos de inteligencia
        federatedInsights: z.array(z.any()).optional(), // Insights Federados
        checklist_status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).default('PENDING').optional(),
    }),
    transitions_history: z.array(WorkflowLogSchema).default([]),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});
export type GenericCase = z.infer<typeof GenericCaseSchema>;

export const EntitySchema = z.object({
    _id: z.any().optional(),
    identifier: z.string(),
    filename: z.string().optional(),
    originalText: z.string(),
    detectedPatterns: z.array(z.object({
        type: z.string(),
        model: z.string(),
    })),
    analysisDate: z.date().default(() => new Date()),
    status: z.string().default('received'),
    isValidated: z.boolean().default(false),
    client: z.string().optional(),
    receivedAt: z.date().optional(),
    errorMessage: z.string().nullable().optional(),
    tenantId: z.string().optional(), // Inyectado por el middleware/helper
    industry: IndustryTypeSchema.default('ELEVATORS'), // Añadido para multi-vertical (Phase 101.1)
    metadata: z.object({
        checklist_status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).default('PENDING').optional(),
        modelos: z.array(z.any()).optional(),
        risks: z.array(RiskFindingSchema).optional(),
        federatedInsights: z.array(z.any()).optional(),
    }).optional(),
    transitions_history: z.array(WorkflowLogSchema).default([]),
    fileMd5: z.string().optional(),
    createdAt: z.date().default(() => new Date()),
    deletedAt: z.date().optional(),
});
export type Entity = z.infer<typeof EntitySchema>;

/**
 * ✅ FASE 6.4: Checklist and Human Validation Schemas
 */

export const ChecklistCategorySchema = z.object({
    id: z.string(),
    name: z.string(),
    color: z.string().optional(),
    keywords: z.array(z.string()).default([]),
    priority: z.number().default(1),
    icon: z.string().optional(),
});
export type ChecklistCategory = z.infer<typeof ChecklistCategorySchema>;

export const ChecklistItemSchema = z.object({
    id: z.string(),
    categoryId: z.string().nullable().optional(),
    description: z.string().min(1),
    notes: z.string().optional(),
    icon: z.string().optional(),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const ChecklistConfigSchema = z.object({
    _id: z.any().optional(),
    name: z.string(),
    categories: z.array(ChecklistCategorySchema).default([]),
    items: z.array(ChecklistItemSchema).default([]),
    workflowOrder: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
    tenantId: z.string(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});
export type ChecklistConfig = z.infer<typeof ChecklistConfigSchema>;

export const ValidationItemSchema = z.object({
    field: z.string(),
    originalValue: z.any(),
    correctedValue: z.any().optional(),
    status: z.enum(['APPROVED', 'CORRECTED', 'REJECTED']).default('APPROVED'),
    comment: z.string().optional(),
});
export type ValidationItem = z.infer<typeof ValidationItemSchema>;

export const ValidationSchema = z.object({
    _id: z.any().optional(),
    entityId: z.string(),
    tenantId: z.string(),
    validatedBy: z.string(), // User ID
    technicianName: z.string().optional(),
    items: z.array(ValidationItemSchema),
    generalStatus: z.enum(['APPROVED', 'REJECTED', 'PARTIAL']).default('APPROVED'),
    validationTime: z.number(), // Segundos
    observations: z.string().optional(),
    timestamp: z.date().default(() => new Date()),
});
export type Validation = z.infer<typeof ValidationSchema>;

export const ItemValidationSchema = z.object({
    itemId: z.string(),
    status: z.enum(['OK', 'REVIEW', 'PENDING']).default('PENDING'),
    notes: z.string().optional(),
});
export type ItemValidation = z.infer<typeof ItemValidationSchema>;
