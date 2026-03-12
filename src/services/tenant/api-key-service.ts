import { connectDB } from '@/lib/db';
import { ApiKeySchema, ApiKeyLogSchema, ApiKey, ApiKeyPermission } from '@/lib/schemas';
import { AppError } from '@/lib/errors';
import { ObjectId } from 'mongodb';
import * as crypto from 'node:crypto';

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
        const db = await connectDB();
        const result = await db.collection('api_keys').insertOne(validated as any);

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
        const db = await connectDB();

        const apiKey = await db.collection('api_keys').findOne({ keyHash });

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

        await db.collection('api_keys').updateOne(
            { _id: apiKey._id },
            { $set: { lastUsedAt: new Date() } }
        );

        return typedApiKey;
    }

    /**
     * Revokes an API Key.
     */
    static async revokeApiKey(keyId: string, tenantId: string) {
        const db = await connectDB();

        await db.collection('api_keys').updateOne(
            { _id: new ObjectId(keyId), tenantId },
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
            const db = await connectDB();
            const logEntry = ApiKeyLogSchema.parse(data);
            await db.collection('api_key_logs').insertOne(logEntry as any);
        } catch (error: unknown) {
            console.error('Failed to log API usage:', error);
        }
    }
}
