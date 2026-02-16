import { connectDB } from '@/lib/db';
import { ApiKeySchema, ApiKeyLogSchema, ApiKey, ApiKeyPermission } from '@/lib/schemas';
import { AppError } from '@/lib/errors';
import crypto from 'crypto';
import { z } from 'zod';

const PREFIX = 'sk_live_';

export class ApiKeyService {

    /**
     * Genera una nueva API Key.
     * Retorna el objeto completo para guardar y la key en texto plano (SOLO UNA VEZ).
     */
    static async createApiKey(
        tenantId: string,
        name: string,
        permissions: ApiKeyPermission[],
        userId: string,
        expiresInDays?: number,
        spaceId?: string
    ): Promise<{ apiKey: ApiKey; plainTextKey: string }> {
        // 1. Generar Key Aleatoria segura
        const randomBytes = crypto.randomBytes(32).toString('hex');
        const plainTextKey = `${PREFIX}${randomBytes}`;

        // 2. Hash SHA-256
        const keyHash = crypto.createHash('sha256').update(plainTextKey).digest('hex');

        // 3. Calcular expiración
        let expiresAt: Date | undefined;
        if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }

        // 4. Preparar Objeto
        const apiKeyData = {
            tenantId,
            keyHash,
            keyPrefix: plainTextKey.substring(0, 15) + '...', // Mostrar un poco más para identificar
            name,
            permissions,
            expiresAt,
            createdBy: userId,
            isActive: true,
            spaceId: spaceId
        };

        // 5. Guardar en DB
        const validated = ApiKeySchema.parse(apiKeyData);
        const db = await connectDB();
        const result = await db.collection('api_keys').insertOne(validated);

        return {
            apiKey: { ...validated, _id: result.insertedId },
            plainTextKey
        };
    }

    /**
     * Valida una API Key entrante.
     * Retorna la API Key si es válida, o null/throw.
     * También actualiza lastUsedAt.
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

        // Validaciones
        if (!typedApiKey.isActive) {
            throw new AppError('FORBIDDEN', 403, 'API Key is revoked/inactive');
        }

        if (typedApiKey.expiresAt && new Date() > new Date(typedApiKey.expiresAt)) {
            throw new AppError('FORBIDDEN', 403, 'API Key has expired');
        }

        if (requiredPermission && !typedApiKey.permissions.includes(requiredPermission)) {
            throw new AppError('FORBIDDEN', 403, `API Key missing required permission: ${requiredPermission}`);
        }

        // Actualizar último uso (fire and forget para no bloquear latencia, salvo que sea crítico)
        await db.collection('api_keys').updateOne(
            { _id: apiKey._id },
            { $set: { lastUsedAt: new Date() } }
        );

        return typedApiKey;
    }

    /**
     * Revoca (desactiva) una API Key.
     */
    static async revokeApiKey(keyId: string, tenantId: string) {
        const db = await connectDB();
        const { ObjectId } = await import('mongodb');

        await db.collection('api_keys').updateOne(
            { _id: new ObjectId(keyId), tenantId },
            { $set: { isActive: false } }
        );
    }

    /**
     * Loguea el uso de la API (Auditoría Técnica)
     */
    static async logUsage(data: {
        apiKeyId: any;
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
            await db.collection('api_key_logs').insertOne(logEntry);
        } catch (error) {
            console.error('Failed to log API usage:', error);
            // No throweamos para no romper el flujo principal por un log secundario
        }
    }
}
