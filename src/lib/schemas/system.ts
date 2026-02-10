import { z } from 'zod';
import { IndustryTypeSchema } from './core';

/**
 * 🛠️ System, Logging and I18n Schemas
 */

export const ApplicationLogSchema = z.object({
    _id: z.any().optional(),
    level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']),
    source: z.string(),
    action: z.string(),
    message: z.string(),
    correlationId: z.string(),
    details: z.any().optional(),
    stack: z.string().optional(),
    timestamp: z.date(),
});
export type ApplicationLog = z.infer<typeof ApplicationLogSchema>;

export const TranslationSchema = z.object({
    _id: z.any().optional(),
    key: z.string(),                  // ej: 'nav.dashboard'
    value: z.string(),                // ej: 'Dashboard'
    locale: z.string(),               // ej: 'es', 'en'
    namespace: z.string().default('common'), // ej: 'admin', 'errors'
    isObsolete: z.boolean().default(false),
    lastUpdated: z.date().default(() => new Date()),
    updatedBy: z.string().optional(),
});
export type Translation = z.infer<typeof TranslationSchema>;

export const AppLocaleSchema = z.object({
    _id: z.any().optional(),
    code: z.string(),                 // ej: 'es', 'en', 'fr'
    name: z.string(),                 // ej: 'Español', 'English'
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
    createdAt: z.date().default(() => new Date()),
});
export type AppLocale = z.infer<typeof AppLocaleSchema>;

export const SystemEmailTemplateSchema = z.object({
    _id: z.any().optional(),
    type: z.string(),
    name: z.string(),
    description: z.string().optional(),
    subjectTemplates: z.record(z.string(), z.string()), // { es: '...', en: '...' }
    bodyHtmlTemplates: z.record(z.string(), z.string()),
    availableVariables: z.array(z.string()).default([]),
    version: z.number().default(1),
    active: z.boolean().default(true),
    updatedAt: z.date().default(() => new Date()),
    updatedBy: z.string().optional()
});
export type SystemEmailTemplate = z.infer<typeof SystemEmailTemplateSchema>;

export const SystemEmailTemplateHistorySchema = z.object({
    _id: z.any().optional(),
    originalTemplateId: z.any(),
    type: z.string(),
    version: z.number(),
    subjectTemplates: z.record(z.string(), z.string()),
    bodyHtmlTemplates: z.record(z.string(), z.string()),
    action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
    performedBy: z.string(),
    reason: z.string().optional(),
    timestamp: z.date().default(() => new Date()),
    validFrom: z.date(),
    validTo: z.date().optional()
});
export type SystemEmailTemplateHistory = z.infer<typeof SystemEmailTemplateHistorySchema>;

export const ContactRequestSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string().optional(),
    name: z.string().min(2),
    email: z.string().email(),
    subject: z.string().min(5),
    message: z.string().min(10),
    status: z.enum(['pending', 'resolved', 'in_progress']).default('pending'),
    answer: z.string().optional(),
    answeredBy: z.string().optional(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});
export type ContactRequest = z.infer<typeof ContactRequestSchema>;

export const AuditTrailSchema = z.object({
    _id: z.any().optional(),
    userId: z.string(),
    tenantId: z.string(),
    action: z.string(), // e.g., "RESET_ONBOARDING", "UPDATE_SETTING"
    entityType: z.enum(['USER', 'TENANT', 'SYSTEM', 'DOCUMENT', 'PROMPT']),
    entityId: z.string(),
    changes: z.object({
        before: z.any().nullable(),
        after: z.any().nullable()
    }),
    correlationId: z.string(),
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    timestamp: z.date().default(() => new Date()),
});
export type AuditTrail = z.infer<typeof AuditTrailSchema>;
