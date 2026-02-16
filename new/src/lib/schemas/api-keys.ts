import { z } from 'zod';

/**
 * 🔌 Public API Key Management Schemas
 */

export const ApiKeyPermissionSchema = z.enum([
    'documents:ingest',
    'documents:read',
    'rag:query',
    'analysis:extract'
]);
export type ApiKeyPermission = z.infer<typeof ApiKeyPermissionSchema>;

export const ApiKeySchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    keyHash: z.string(),           // Hash SHA-256 de la key completa
    keyPrefix: z.string(),         // Primeros 7 caracteres para display (ej: "sk_live_...")
    name: z.string(),              // "Producción CRM"
    permissions: z.array(ApiKeyPermissionSchema),
    lastUsedAt: z.date().optional(),
    expiresAt: z.date().optional(), // Null = Never
    isActive: z.boolean().default(true),
    createdAt: z.date().default(() => new Date()),
    createdBy: z.string(),          // User ID
    spaceId: z.string().optional()  // Restricted to a specific Space (optional)
});
export type ApiKey = z.infer<typeof ApiKeySchema>;

export const ApiKeyLogSchema = z.object({
    _id: z.any().optional(),
    apiKeyId: z.any(),
    tenantId: z.string(),
    endpoint: z.string(),
    method: z.string(),
    statusCode: z.number(),
    durationMs: z.number(),
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    timestamp: z.date().default(() => new Date())
});
export type ApiKeyLog = z.infer<typeof ApiKeyLogSchema>;
