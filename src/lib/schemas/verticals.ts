import { z } from 'zod';
import { IndustryTypeSchema } from './core';

/**
 * Schema for localized text (ES/EN)
 */
export const LocalizedTextSchema = z.object({
    es: z.string(),
    en: z.string(),
});

/**
 * Field definition specific to a vertical
 */
export const VerticalFieldSchema = z.object({
    key: z.string(),
    label: LocalizedTextSchema,
    type: z.enum(['string', 'number', 'boolean', 'date', 'select']),
    required: z.boolean().default(false),
    options: z.array(z.object({
        label: LocalizedTextSchema,
        value: z.string()
    })).optional(),
});

/**
 * Configuration for a specific vertical/industry
 */
export const VerticalConfigSchema = z.object({
    industry: IndustryTypeSchema,
    entityLabel: LocalizedTextSchema,      // e.g., "Pedido" / "Claim"
    entityLabelPlural: LocalizedTextSchema, // e.g., "Pedidos" / "Claims"
    defaultWorkflowTemplate: z.string().optional(),
    defaultChecklistTemplate: z.string().optional(),
    promptPack: z.string(),                // Key for prompt grouping
    features: z.record(z.boolean()).default({} as Record<string, boolean>),
    fields: z.array(VerticalFieldSchema).default([]),
});

export type VerticalConfig = z.infer<typeof VerticalConfigSchema>;
export type VerticalField = z.infer<typeof VerticalFieldSchema>;
