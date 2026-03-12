import { z } from 'zod';
import { TenantIdSchema, EntityIdSchema } from './core';

/**
 * 🔍 Schema para validar las consultas de logs de auditoría.
 * Sigue la Regla de Oro #2: Zod Validation BEFORE Processing.
 */
export const AuditLogQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(500).default(50),
    search: z.string().optional().default(''),
    level: z.enum(['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG']).default('ALL'),
    source: z.string().optional().default('ALL'),
    type: z.enum(['APPLICATION', 'CONFIG', 'ADMIN', 'ACCESS', 'SECURITY', 'ALL']).default('ALL'),
    correlationId: EntityIdSchema.optional(),
    page: z.coerce.number().min(1).default(1),
});

export type AuditLogQuery = z.infer<typeof AuditLogQuerySchema>;

/**
 * 📝 Estructura de un log de auditoría (unificada para visualización)
 */
export const AuditLogEntrySchema = z.object({
    _id: z.any().optional(),
    tenantId: TenantIdSchema,
    level: z.string(),
    source: z.string(),
    action: z.string(),
    message: z.string(),
    timestamp: z.coerce.date(),
    userEmail: z.string().optional(),
    correlationId: z.string().optional(),
    actorType: z.enum(['USER', 'IA', 'SYSTEM']).optional(),
    entityType: z.string().optional(),
    entityId: EntityIdSchema.optional(),
    reason: z.string().optional(),
    changes: z.object({
        before: z.any(),
        after: z.any()
    }).optional(),
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    details: z.record(z.string(), z.any()).optional(),
});


export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

// RagAudit removed - imported from knowledge.ts (bridge to rag-engine)


// IngestAudit removed - imported from knowledge.ts (bridge to rag-engine)

