import { z } from 'zod';
import { EntityIdSchema, TenantIdSchema, TenantScopedSchema } from './common';

/**
 * 🔔 FASE 23: Notification & Communication Engine Schemas
 */

export const NotificationTypeSchema = z.enum([
    'SYSTEM',
    'ANALYSIS_COMPLETE',
    'RISK_ALERT',
    'BILLING_EVENT',
    'SECURITY_ALERT'
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationChannelSchema = z.enum(['EMAIL', 'IN_APP', 'PUSH']);
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

// Configuración de destinatarios y canales por Tenant
export const NotificationTenantConfigSchema = z.object({
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema,

    // Matriz de configuración por tipo de evento
    events: z.record(NotificationTypeSchema, z.object({
        enabled: z.boolean().default(true),
        channels: z.array(NotificationChannelSchema).default(['IN_APP', 'EMAIL']),
        recipients: z.array(z.string().email()).default([]),

        // Personalización Simple (Tenant Level)
        customNote: z.string().optional(), // Texto extra que se inyecta en {{tenant_custom_note}}
        includeCustomNote: z.boolean().default(true)
    })),

    // Email de fallback si no hay destinatarios definidos
    fallbackEmail: z.string().email().optional(),

    updatedAt: z.date(),
    updatedBy: EntityIdSchema
});
export type NotificationTenantConfig = z.infer<typeof NotificationTenantConfigSchema>;

// Entidad de Notificación individual (Historial)
export const NotificationSchema = TenantScopedSchema.extend({
    userId: EntityIdSchema, // 🚀 ERA 12: Mandatory for relational integrity
    type: NotificationTypeSchema,
    level: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']),
    title: z.string(),
    message: z.string(),
    link: z.string().optional(),

    // Estado de lectura (In-App)
    read: z.boolean().default(false),
    readAt: z.date().optional(),

    // Estado de envío (Email)
    emailSent: z.boolean().default(false),
    emailSentAt: z.date().optional(),
    emailRecipient: z.string().email().optional(), // A quién se envió realmente

    archived: z.boolean().default(false),
    metadata: z.record(z.string(), z.any()).optional(),

    // Campos de Business Intelligence (BI) para explotación
    category: z.enum(['BILLING', 'TECHNICAL', 'SUPPORT', 'MARKETING', 'SYSTEM']).default('SYSTEM'),
    triggerValue: z.number().optional(), // Ej: 95 (porcentaje de uso), 3 (intentos fallidos)
    campaignId: EntityIdSchema.optional() // Para identificar ofertas manuales o campañas
});
export type Notification = z.infer<typeof NotificationSchema>;

/**
 * Estadísticas Agregadas de Notificaciones (Materialized View)
 */
export const NotificationStatsSchema = z.object({
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema,
    month: z.string(), // "2026-01"

    // Contadores por categoría
    counts: z.object({
        BILLING_ALERTS: z.number().default(0),    // Candidato a Upsell
        TECHNICAL_ERRORS: z.number().default(0),  // Necesita formación
        SUPPORT_TICKETS: z.number().default(0),   // Riesgo de Churn
        MARKETING_SENT: z.number().default(0)
    }),

    // Flags derivados
    flags: z.object({
        isUpsellCandidate: z.boolean().default(false),
        needsTraining: z.boolean().default(false),
        churnRisk: z.boolean().default(false)
    }),

    updatedAt: z.date()
});
export type NotificationStats = z.infer<typeof NotificationStatsSchema>;

/**
 * Plantillas de Notificación (Email/In-App/Push)
 */
export const NotificationTemplateSchema = z.object({
    _id: EntityIdSchema.optional(),
    type: NotificationTypeSchema, // Unique index
    name: z.string(), // "System Default - Billing Alert"

    // Soporte i18n
    subjectTemplates: z.record(z.string(), z.string()),
    bodyHtmlTemplates: z.record(z.string(), z.string()),

    availableVariables: z.array(z.string()),
    description: z.string().optional(),
    version: z.number().default(1),
    active: z.boolean().default(true),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    createdBy: EntityIdSchema.optional(),
    updatedBy: EntityIdSchema.optional() // ID del SuperAdmin
});
export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>;

export const NotificationTemplateHistorySchema = z.object({
    _id: EntityIdSchema.optional(),
    originalTemplateId: EntityIdSchema,
    type: NotificationTypeSchema,
    version: z.number(),

    // Snapshot del contenido
    subjectTemplates: z.record(z.string(), z.string()),
    bodyHtmlTemplates: z.record(z.string(), z.string()),

    // Auditoría
    action: z.enum(['CREATE', 'UPDATE', 'DEACTIVATE']),
    performedBy: EntityIdSchema,
    reason: z.string().optional(),
    timestamp: z.date().default(() => new Date()),

    validFrom: z.date(),
    validTo: z.date().optional()
});
export type NotificationTemplateHistory = z.infer<typeof NotificationTemplateHistorySchema>;

export const NotificationTenantConfigHistorySchema = z.object({
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema,
    configId: EntityIdSchema,

    // Snapshot de lo que cambió
    eventsSnapshot: z.record(NotificationTypeSchema, z.any()),

    // Auditoría
    action: z.enum(['UPDATE_SETTINGS', 'UPDATE_CUSTOM_NOTE']),
    performedBy: EntityIdSchema,
    reason: z.string().optional(),
    timestamp: z.date().default(() => new Date())
});
export type NotificationTenantConfigHistory = z.infer<typeof NotificationTenantConfigHistorySchema>;
