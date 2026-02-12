import { z } from 'zod';
import { IndustryTypeSchema, AppEnvironmentEnum } from './core';

/**
 * 📝 FASE 7.6: Dynamic Prompt Management Schemas
 */

export const PromptVariableSchema = z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
    description: z.string().optional(),
    required: z.boolean().default(true),
});
export type PromptVariable = z.infer<typeof PromptVariableSchema>;

export const PromptVersionSchema = z.object({
    promptId: z.any(),
    tenantId: z.string(),
    version: z.number(),
    template: z.string(),
    variables: z.array(PromptVariableSchema).default([]),
    changedBy: z.string(),
    changeReason: z.string().optional(),
    correlationId: z.string().optional(), // Trazabilidad bancaria
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    environment: AppEnvironmentEnum.default('PRODUCTION'),
    industry: IndustryTypeSchema.default('GENERIC'),
    category: z.enum(['EXTRACTION', 'RISK', 'ANALYSIS', 'GENERAL', 'TICKET', 'CHECKLIST', 'ROUTING']).optional(),
    model: z.string().optional(),
    createdAt: z.date().default(() => new Date()),
});
export type PromptVersion = z.infer<typeof PromptVersionSchema>;

export const PromptSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    key: z.string(),
    name: z.string(),
    description: z.string().optional(),
    environment: AppEnvironmentEnum.default('PRODUCTION'),
    category: z.enum(['EXTRACTION', 'RISK', 'ANALYSIS', 'GENERAL', 'TICKET', 'CHECKLIST', 'ROUTING']).default('GENERAL'),
    industry: IndustryTypeSchema.default('GENERIC'),
    model: z.string().default('gemini-1.5-flash'), // Permite elegir el modelo por cada prompt
    template: z.string(),
    variables: z.array(PromptVariableSchema).default([]),
    version: z.number().default(1),
    active: z.boolean().default(true),
    maxLength: z.number().optional(),
    isShadowActive: z.boolean().default(false), // Activa la ejecución en paralelo de un prompt sombra
    shadowPromptKey: z.string().optional(),     // Key del prompt a usar como sombra (A/B testing)
    shadowModel: z.string().optional(),         // Modelo específico para la sombra
    updatedAt: z.date().default(() => new Date()),
    updatedBy: z.string().optional(),
    createdBy: z.string().optional(),
    createdAt: z.date().default(() => new Date()),
}).refine(data => {
    if (data.maxLength && data.template.length > data.maxLength) return false;
    return true;
}, {
    message: "La longitud del template excede el máximo permitido (maxLength)",
    path: ["template"]
});
export type Prompt = z.infer<typeof PromptSchema>;
