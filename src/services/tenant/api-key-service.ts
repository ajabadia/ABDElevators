import { ApiKeySchema, ApiKeyLogSchema, ApiKey, ApiKeyPermission } from '@/lib/schemas';
import { AppError } from '@/lib/errors';
import { ObjectId } from 'mongodb';
import * as crypto from 'node:crypto';
import { getTenantCollection } from '@/lib/db-tenant';
import { type TenantId, type EntityId } from '@/lib/schemas/common';

const PREFIX = 'sk_live_';

/**
 * 🔑 ApiKeyService: Programmatic access token management (Phase 120.2)
 * Part of the Tenant Management domain.
 */
export class ApiKeyService {

    /**
     * Generates a new API Key.
     */
    static async createApiKey(
        tenantId: string,
        name: string,
        permissions: ApiKeyPermission[],
        userId: string,
        expiresInDays?: number,
        scopes: ApiKey['scopes'] = {}
    ): Promise<{ apiKey: ApiKey; plainTextKey: string }> {
        const randomBytes = crypto.randomBytes(32).toString('hex');
        const plainTextKey = `${PREFIX}${randomBytes}`;
        const keyHash = crypto.createHash('sha256').update(plainTextKey).digest('hex');

        let expiresAt: Date | undefined;
        if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }

        const apiKeyData = {
            tenantId,
            keyHash,
            keyPrefix: plainTextKey.substring(0, 15) + '...',
            name,
            permissions,
            expiresAt,
            createdBy: userId,
            isActive: true,
            scopes: {
                ...scopes,
                tenantId: scopes.tenantId || tenantId // Ensure tenantId is set
            }
        };

        const validated = ApiKeySchema.parse(apiKeyData);
        // Secure Collection for MAIN cluster (api_keys)
        const systemSession = { user: { id: userId, tenantId: tenantId as TenantId, role: 'ADMIN' } };
        const collection = await getTenantCollection<ApiKey>('api_keys', systemSession as any);
        const result = await collection.insertOne(validated as any);

        return {
            apiKey: { ...validated, _id: result.insertedId.toString() } as any,
            plainTextKey
        };
    }

    /**
     * Validates an incoming API Key.
     */
    static async validateApiKey(
        rawKey: string,
        requiredPermission?: ApiKeyPermission
    ): Promise<ApiKey> {
        if (!rawKey || !rawKey.startsWith(PREFIX)) {
            throw new AppError('UNAUTHORIZED', 401, 'Invalid API Key format');
        }

        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
        
        // cross-tenant validation requires unsecure raw access or platform_master context
        const platformSession = { user: { id: '000000000000000000000000', tenantId: '000000000000000000000000' as TenantId, role: 'SUPER_ADMIN' } };
        const collection = await getTenantCollection<ApiKey>('api_keys', platformSession as any);

        const apiKey = await collection.findOne({ keyHash } as any);

        if (!apiKey) {
            throw new AppError('UNAUTHORIZED', 401, 'Invalid API Key');
        }

        const typedApiKey = apiKey as unknown as ApiKey;

        if (!typedApiKey.isActive) {
            throw new AppError('FORBIDDEN', 403, 'API Key is revoked/inactive');
        }

        if (typedApiKey.expiresAt && new Date() > new Date(typedApiKey.expiresAt)) {
            throw new AppError('FORBIDDEN', 403, 'API Key has expired');
        }

        if (requiredPermission && !typedApiKey.permissions.includes(requiredPermission)) {
            throw new AppError('FORBIDDEN', 403, `API Key missing required permission: ${requiredPermission}`);
        }

        await collection.updateOne(
            { _id: apiKey._id } as any,
            { $set: { lastUsedAt: new Date() } }
        );

        return typedApiKey;
    }

    /**
     * Revokes an API Key.
     */
    static async revokeApiKey(keyId: string, tenantId: string) {
        const systemSession = { user: { id: '000000000000000000000000', tenantId: tenantId as TenantId, role: 'ADMIN' } };
        const collection = await getTenantCollection<ApiKey>('api_keys', systemSession as any);

        await collection.updateOne(
            { _id: new ObjectId(keyId) as any, tenantId: tenantId as any } as any,
            { $set: { isActive: false } }
        );
    }

    /**
     * Logs API usage (Technical Audit)
     */
    static async logUsage(data: {
        apiKeyId: ObjectId | string;
        tenantId: string;
        endpoint: string;
        method: string;
        statusCode: number;
        durationMs: number;
        ip?: string;
        userAgent?: string;
    }) {
        try {
            const systemSession = { user: { id: '000000000000000000000000', tenantId: data.tenantId as TenantId, role: 'SYSTEM' } };
            const collection = await getTenantCollection('api_key_logs', systemSession as any, 'LOGS');
            const logEntry = ApiKeyLogSchema.parse(data);
            await collection.insertOne(logEntry as any);
        } catch (error: unknown) {
            // Internal error in logging shouldn't crash caller but shouldn't use console.log in prod
        }
    }
}
