'use server';

import { auth, requirePermission } from '@/lib/auth';
import { ApiKeyService } from '@/services/tenant/api-key-service';
import { ApiKeyPermission } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { ObjectId } from 'mongodb';
import { ObjectIdSchema } from '@/lib/schemas/common';
import { REGEX } from '@/lib/sanitization';

import { ApiKey } from '@/lib/schemas';
import { z } from 'zod';

const SLOW_KEY_FETCH_MS = 500;
const SLOW_KEY_CREATE_MS = 2000;

const ApiKeyScopeSchema = z.object({
    spaceIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    assetIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
}).strict();

/**
 * Crea una nueva API Key con aislamiento seguro de tenant y registro de auditoría.
 */
export async function createApiKey(
    name: string,
    permissions: ApiKeyPermission[],
    expiresInDays?: number,
    scopes: unknown = {}
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_KEYS', action: 'CREATE_API_KEY' },
        async ({ log, correlationId }) => {
            const start = Date.now();
            try {
                const session = await requirePermission('admin:api_keys', 'manage');

                const tenantId = session.user.tenantId;
                const validatedScopes = ApiKeyScopeSchema.parse(scopes);

                if (validatedScopes.spaceIds && Array.isArray(validatedScopes.spaceIds)) {
                    for (const spaceId of validatedScopes.spaceIds) {
                        if (!REGEX.OBJECT_ID.test(spaceId)) {
                            throw new AppError('VALIDATION_ERROR', 400, `Invalid ObjectId space ID: ${spaceId}`);
                        }
                        ObjectIdSchema.parse(spaceId);
                        const spacesCollection = await getTenantCollection('spaces', session);
                        const space = await spacesCollection.findOne({ _id: new ObjectId(spaceId), tenantId });
                        if (!space) throw new AppError('FORBIDDEN', 403, `Unauthorized space ID: ${spaceId}`);
                    }
                }

                const result = await ApiKeyService.createApiKey(
                    tenantId,
                    name,
                    permissions,
                    session.user.id,
                    expiresInDays,
                    validatedScopes as any
                );

                const duration = Date.now() - start;
                await log({
                    message: `API Key '${name}' created successfully`,
                    details: { keyId: result.apiKey._id, duration_ms: duration }
                });

                revalidatePath('/settings/api-keys');
                return {
                    success: true,
                    data: {
                        ...result,
                        apiKey: {
                            ...result.apiKey,
                            _id: result.apiKey._id?.toString()
                        }
                    }
                };

            } catch (error: unknown) {
                if (error instanceof AppError) {
                    return { success: false, error: error.message };
                }
                const message = error instanceof Error ? error.message : 'Internal server error';
                return { success: false, error: message };
            }
        }
    );
}

/**
 * Revoca una API Key de forma segura.
 */
export async function revokeApiKey(keyId: string) {
    return withCorrelation(
        { level: 'WARN', source: 'API_KEYS', action: 'REVOKE_API_KEY' },
        async ({ log }) => {
            const start = Date.now();
            try {
                ObjectIdSchema.parse(keyId);
                const session = await auth();
                if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
                    throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
                }

                const result = await ApiKeyService.revokeApiKey(keyId, session.user.tenantId);
                const duration = Date.now() - start;

                await log({
                    message: `API Key revoked: ${keyId}`,
                    details: { keyId, duration_ms: duration }
                });

                revalidatePath('/admin/api-keys');
                return { success: true };
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Error revoking API key';
                return { success: false, error: message };
            }
        }
    );
}

/**
 * Obtiene las API Keys del tenant actual usando SecureCollection.
 */
export async function getApiKeys() {
    return withCorrelation(
        { level: 'INFO', source: 'API_KEYS', action: 'FETCH_API_KEYS' },
        async ({ log }) => {
            const start = Date.now();
            const session = await auth();
            if (!session) throw new AppError('UNAUTHORIZED', 401, 'No session');

            const keysCollection = await getTenantCollection<ApiKey>('api_keys', session);
            const keys = await keysCollection.find({}, { sort: { createdAt: -1 } }).toArray();

            const duration = Date.now() - start;
            if (duration > SLOW_KEY_FETCH_MS) {
                await log({
                    level: 'WARN',
                    action: 'FETCH_SLOW',
                    message: `Slow API Keys fetch detected (${duration}ms)`,
                    details: { duration_ms: duration, count: keys.length }
                });
            }

            return keys.map((k: any) => ({
                ...k,
                _id: (k as any)._id.toString(),
                createdAt: (k as any).createdAt,
                expiresAt: (k as any).expiresAt as Date | undefined,
                lastUsedAt: (k as any).lastUsedAt
            }));
        }
    );
}
