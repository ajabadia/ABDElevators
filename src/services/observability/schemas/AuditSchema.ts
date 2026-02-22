import { z } from 'zod';

/**
 * 🔒 Audit Schema (Business Compliance)
 * High-impact events for legal, security, and administrative tracking.
 */

export const AuditActorType = ['USER', 'IA', 'SYSTEM'] as const;
export const AuditEntityType = ['USER', 'TENANT', 'SYSTEM', 'DOCUMENT', 'PROMPT', 'BILLING', 'GOVERNANCE', 'SECURITY'] as const;
export const AuditSource = ['CONFIG_CHANGE', 'ADMIN_OP', 'DATA_ACCESS', 'SECURITY_EVENT', 'WORKFLOW', 'BILLING_EVENT'] as const;

export const AuditSchema = z.object({
    _id: z.any().optional(),
    actorType: z.enum(AuditActorType).default('USER'),
    actorId: z.string(), // ID of the user, agent, or system component
    tenantId: z.string(),

    action: z.string(), // e.g. "UPDATE_PERMISSIONS", "DELETE_WORKSPACE"
    entityType: z.enum(AuditEntityType),
    entityId: z.string(),
    source: z.enum(AuditSource).default('CONFIG_CHANGE'),

    changes: z.object({
        before: z.any().nullable(),
        after: z.any().nullable()
    }).optional(),

    reason: z.string().optional(), // Mandatory for critical service changes
    correlationId: z.string(),

    ip: z.string().optional(),
    userAgent: z.string().optional(),

    timestamp: z.date().default(() => new Date()),
});

export type AuditEntry = z.infer<typeof AuditSchema>;
