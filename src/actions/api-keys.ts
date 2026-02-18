'use server';

import { auth } from '@/lib/auth';
import { ApiKeyService } from '@/lib/api-key-service';
import { ApiKeyPermission } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { generateUUID } from '@/lib/utils';
import { Document, ObjectId } from 'mongodb';

export interface ApiKey extends Document {
    name: string;
    key: string;
    prefix: string;
    tenantId: string;
    userId: string;
    status: 'ACTIVE' | 'REVOKED';
    lastUsedAt?: Date;
    createdAt: Date;
}

/**
 * Crea una nueva API Key con aislamiento seguro de tenant y registro de auditoría.
 */
export async function createApiKey(name: string, permissions: ApiKeyPermission[], expiresInDays?: number, spaceId?: string) {
    const correlationId = generateUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado para crear llaves de API');
        }

        const tenantId = session.user.tenantId;
        const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

        // 🛡️ SECURITY BUG FIX (Historical Audit 2401): Validate spaceId ownership
        if (spaceId && !isSuperAdmin) {
            const spacesCollection = await getTenantCollection('spaces', session);
            const space = await spacesCollection.findOne({ _id: new ObjectId(spaceId) });
            if (!space) {
                await logEvento({
                    level: 'ERROR',
                    source: 'API_KEYS',
                    action: 'TENANT_ISOLATION_VIOLATION',
                    message: `Attempted to create API key for unauthorized space: ${spaceId}`,
                    correlationId,
                    details: { tenantId, spaceId, userId: session.user.id }
                });
                throw new AppError('FORBIDDEN', 403, 'El espacio especificado no existe o no pertenece a su organización');
            }
        }

        await logEvento({
            level: 'INFO',
            source: 'API_KEYS',
            action: 'CREATE_START',
            message: `Starting API Key creation for name: ${name}`,
            correlationId,
            details: { name, permissions, tenantId }
        });

        const result = await ApiKeyService.createApiKey(
            tenantId,
            name,
            permissions,
            session.user.id,
            expiresInDays,
            spaceId
        );

        const duration = Date.now() - start;
        await logEvento({
            level: 'INFO',
            source: 'API_KEYS',
            action: 'CREATE_SUCCESS',
            message: `API Key '${name}' created successfully`,
            correlationId,
            details: { keyId: result.apiKey._id, duration_ms: duration }
        });

        revalidatePath('/admin/api-keys');
        return { success: true, data: result };

    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'API_KEYS',
            action: 'CREATE_ERROR',
            correlationId,
            message: error.message,
            details: { stack: error.stack }
        });

        if (error instanceof AppError) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Internal server error during key creation' };
    }
}

/**
 * Revoca una API Key de forma segura.
 */
export async function revokeApiKey(keyId: string) {
    const correlationId = generateUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const tenantId = session.user.tenantId;

        const result = await ApiKeyService.revokeApiKey(keyId, tenantId);

        const duration = Date.now() - start;
        await logEvento({
            level: 'WARN',
            source: 'API_KEYS',
            action: 'REVOKE_SUCCESS',
            message: `API Key revoked: ${keyId}`,
            correlationId,
            details: { keyId, tenantId, duration_ms: duration }
        });

        revalidatePath('/admin/api-keys');
        return { success: true };
    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'API_KEYS',
            action: 'REVOKE_ERROR',
            correlationId,
            message: error.message
        });
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene las API Keys del tenant actual usando SecureCollection.
 */
export async function getApiKeys() {
    const correlationId = generateUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (!session) throw new AppError('UNAUTHORIZED', 401, 'No session');

        const keysCollection = await getTenantCollection<ApiKey>('api_keys', session);
        const keys = await keysCollection.find({}, { sort: { createdAt: -1 } });

        const duration = Date.now() - start;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_KEYS',
                action: 'FETCH_SLOW',
                message: `Slow API Keys fetch detected (${duration}ms)`,
                correlationId,
                details: { duration_ms: duration, count: keys.length }
            });
        }

        return keys.map(k => ({
            ...k,
            _id: k._id.toString(),
            createdAt: k.createdAt,
            expiresAt: k.expiresAt,
            lastUsedAt: k.lastUsedAt
        }));
    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'API_KEYS',
            action: 'FETCH_ERROR',
            correlationId,
            message: error.message
        });
        throw error;
    }
}
