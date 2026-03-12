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
    entityLabel: LocalizedTextSchema,      // e.g., "Order" / "Claim"
    entityLabelPlural: LocalizedTextSchema, // e.g., "Orders" / "Claims"
    defaultWorkflowTemplate: z.string().optional(),
    defaultChecklistTemplate: z.string().optional(),
    promptPack: z.string(),                // Key for prompt grouping
    ragPresets: z.object({
        chunkSize: z.number().default(1000),
        chunkOverlap: z.number().default(200),
        llmTemperature: z.number().default(0.1),
        systemFocus: z.string().optional(),
    }).default({
        chunkSize: 1000,
        chunkOverlap: 200,
        llmTemperature: 0.1
    }),
    features: z.record(z.string(), z.boolean()).default({} as Record<string, boolean>),
    fields: z.array(VerticalFieldSchema).default([]),
});

export type VerticalConfig = z.infer<typeof VerticalConfigSchema>;
export type VerticalField = z.infer<typeof VerticalFieldSchema>;
