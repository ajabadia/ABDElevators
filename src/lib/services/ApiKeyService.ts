import { crypto } from 'node:crypto';
import { ApiKey, ApiKeySchema } from '../schemas/api-keys';
import { getTenantCollection } from '../db-tenant';
import { ValidationError } from '@abd/platform-core';

/**
 * 🔑 ApiKeyService
 * Gestión segura de API Keys (Era 12 Hardening).
 * Almacenamiento hashed (SHA-256) + Prefijos para UX.
 */
export class ApiKeyService {
    private static COLLECTION = 'api_keys';
    private static PREFIX = 'sk_live_';

    /**
     * Genera una nueva API Key y devuelve el texto plano (solo una vez) y el hash.
     */
    static generateRawKey(): { rawKey: string, keyPrefix: string, keyHash: string } {
        const randomPart = crypto.randomBytes(24).toString('base64url');
        const rawKey = `${this.PREFIX}${randomPart}`;
        const keyPrefix = rawKey.substring(0, 10);
        const keyHash = this.hashKey(rawKey);

        return { rawKey, keyPrefix, keyHash };
    }

    /**
     * Hashea una clave usando SHA-256.
     */
    static hashKey(rawKey: string): string {
        return crypto.createHash('sha256').update(rawKey).digest('hex');
    }

    /**
     * Valida una clave en texto plano contra la base de datos.
     */
    static async validateKey(rawKey: string, tenantId?: string): Promise<ApiKey | null> {
        if (!rawKey.startsWith(this.PREFIX)) return null;

        const hash = this.hashKey(rawKey);

        // Usamos platform_master session para buscar el hash a través de todos los tenants si no hay tenantId
        // Pero idealmente el header 'x-tenant-id' debería venir en la request.
        const session = { user: { id: 'system', tenantId: tenantId || 'platform_master', role: 'SYSTEM' } } as any;
        const collection = await getTenantCollection(this.COLLECTION, session, 'CONFIG');

        const apiKeyDoc = await collection.findOne({ keyHash: hash, isActive: true });
        if (!apiKeyDoc) return null;

        const apiKey = ApiKeySchema.parse(apiKeyDoc);

        // Validar expiración
        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
            return null;
        }

        return apiKey;
    }

    /**
     * Verifica si una API Key tiene permiso para una acción y recurso específico.
     */
    static async checkPermissions(apiKey: ApiKey, requiredPermission: string, resourceIds?: { spaceId?: string, assetId?: string }): Promise<boolean> {
        // 1. Check Permissions Array
        if (!(apiKey.permissions as string[]).includes(requiredPermission)) {
            return false;
        }

        // 2. Check Scopes (Relational Integrity)
        const { scopes } = apiKey;
        if (!scopes) return true;

        if (resourceIds?.spaceId && scopes.spaceIds && scopes.spaceIds.length > 0) {
            if (!scopes.spaceIds.map(id => id.toString()).includes(resourceIds.spaceId)) {
                return false;
            }
        }

        if (resourceIds?.assetId && scopes.assetIds && scopes.assetIds.length > 0) {
            if (!scopes.assetIds.map(id => id.toString()).includes(resourceIds.assetId)) {
                return false;
            }
        }

        return true;
    }
}
