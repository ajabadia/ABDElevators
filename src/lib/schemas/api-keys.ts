import { z } from 'zod';
import { EntityIdSchema, TenantIdSchema, TenantScopedSchema } from './common';
// ⚠️ FASE 182: DO NOT import 'mongodb' in shared schemas as it leaks to client bundles
// import { ObjectId } from 'mongodb';

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

export const ApiKeySchema = TenantScopedSchema.extend({
    _id: EntityIdSchema.optional(),
    keyHash: z.string(),           // Hash SHA-256 de la key completa
    keyPrefix: z.string(),         // Primeros 7 caracteres para display (ej: "sk_live_...")
    name: z.string(),              // "Producción CRM"
    permissions: z.array(ApiKeyPermissionSchema),
    lastUsedAt: z.date().optional(),
    expiresAt: z.date().optional(), // Null = Never
    isActive: z.boolean().default(true),
    updatedAt: z.date().optional(),

    // 🚀 ERA 12: Granular Scopes for Relational Integrity
    scopes: z.object({
        tenantId: TenantIdSchema.optional(),
        spaceIds: z.array(EntityIdSchema).optional(),
        assetIds: z.array(EntityIdSchema).optional(),
        allowedIps: z.array(z.string()).optional()
    }).default({})
});
export type ApiKey = z.infer<typeof ApiKeySchema>;

export const ApiKeyLogSchema = z.object({
    apiKeyId: EntityIdSchema,
    tenantId: TenantIdSchema,
    endpoint: z.string(),
    method: z.string(),
    statusCode: z.number(),
    durationMs: z.number(),
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    timestamp: z.date().default(() => new Date())
});
export type ApiKeyLog = z.infer<typeof ApiKeyLogSchema>;
