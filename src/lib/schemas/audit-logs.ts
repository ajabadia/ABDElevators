import { z } from 'zod';

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
    correlationId: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
});

export type AuditLogQuery = z.infer<typeof AuditLogQuerySchema>;

/**
 * 📝 Estructura de un log de auditoría (unificada para visualización)
 */
export const AuditLogEntrySchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    level: z.string(),
    source: z.string(),
    action: z.string(),
    message: z.string(),
    timestamp: z.coerce.date(),
    userEmail: z.string().optional(),
    correlationId: z.string().optional(),
    actorType: z.enum(['USER', 'IA', 'SYSTEM']).optional(),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
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

/**
 * 🛡️ Esquema para Auditoría RAG (Trazabilidad)
 * Regla de Oro #4
 */
export const RagAuditSchema = z.object({
    _id: z.any().optional(),
    correlationId: z.string().uuid(),
    phase: z.string(),                    // 'EXTRACCION_MODELOS', 'VECTOR_SEARCH', 'REPORTE'
    input: z.any(),                      // prompt o query
    output: z.any(),                     // respuesta Gemini o resultados search
    durationMs: z.number(),
    token_usage: z.object({
        prompt: z.number(),
        completion: z.number(),
    }).optional(),
    timestamp: z.date().default(() => new Date()),
});

export type RagAudit = z.infer<typeof RagAuditSchema>;

/**
 * 🏗️ Esquema para Auditoría de Ingesta
 */
export const IngestAuditSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    performedBy: z.string(), // Email o ID del usuario
    ip: z.string().optional(),
    userAgent: z.string().optional(),

    // Detalles del archivo
    filename: z.string(),
    fileSize: z.number(),
    md5: z.string(),
    docId: z.any().optional(), // ID en documentos_tecnicos

    // Metadata
    correlationId: z.string(),
    status: z.enum(['SUCCESS', 'FAILED', 'DUPLICATE', 'PENDING', 'RESTORED']),
    details: z.object({
        chunks: z.number().default(0),
        duration_ms: z.number(),
        savings_tokens: z.number().optional(),
        error: z.string().optional()
    }).optional(),

    timestamp: z.date().default(() => new Date()),
});

export type IngestAudit = z.infer<typeof IngestAuditSchema>;
