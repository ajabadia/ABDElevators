import { getTenantCollection } from "@/lib/db-tenant";
import { TenantConfigSchema } from "@/lib/schemas";
import { AppError, NotFoundError } from "@/lib/errors";
import crypto from 'crypto';
import { ClientSession } from 'mongodb';

/**
 * TenantService (formerly TenantConfigService)
 * Domain-specific service for tenant management.
 */
export class TenantService {
    private static cache = new Map<string, { data: any, timestamp: number }>();
    private static CACHE_TTL = 5 * 60 * 1000;

    static async getConfig(tenantId: string) {
        try {
            const session = { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any;
            const collection = await getTenantCollection('tenants', session);
            const config = await collection.findOne({ tenantId });

            if (!config) {
                throw new NotFoundError(`Tenant config not found for ID: ${tenantId}`);
            }

            const validated = TenantConfigSchema.parse(config);
            this.cache.set(tenantId, { data: validated, timestamp: Date.now() });

            return validated;
        } catch (error: any) {
            if (error instanceof NotFoundError) throw error;
            throw new AppError('TENANT_CONFIG_ERROR', 500, 'Error al recuperar configuración del tenant');
        }
    }

    static async updateConfig(
        tenantId: string,
        data: any,
        metadata?: { performedBy: string, correlationId?: string, session?: ClientSession }
    ): Promise<any> {
        const correlationId = metadata?.correlationId || crypto.randomUUID();

        try {
            const validated = TenantConfigSchema.partial().parse(data);
            const session = { user: { id: metadata?.performedBy || 'SYSTEM', tenantId, role: 'USER' } } as any;
            const collection = await getTenantCollection('tenants', session);
            const previousState = await collection.findOne({ tenantId });

            const { _id, tenantId: _ign, ...updateData } = validated as any;
            await collection.updateOne(
                { tenantId },
                { $set: { ...updateData, updatedAt: new Date() } },
                { upsert: true, session: metadata?.session }
            );

            this.cache.delete(tenantId);

            // Audit via internal dynamic import
            const { AuditTrailService } = await import('@/services/security/audit-trail-service').catch(() => ({ AuditTrailService: null as any }));
            if (AuditTrailService) {
                await AuditTrailService.logConfigChange({
                    actorId: metadata?.performedBy || 'SYSTEM',
                    actorType: 'USER',
                    tenantId,
                    action: 'UPDATE_TENANT_CONFIG',
                    entityType: 'TENANT',
                    entityId: tenantId,
                    changes: { before: previousState, after: validated },
                    correlationId
                } as any);
            }

            return validated;
        } catch (error: any) {
            throw error;
        }
    }

    static async getAllTenants() {
        const session = { user: { role: 'SUPER_ADMIN' } } as any;
        const collection = await getTenantCollection('tenants', session);
        return await collection.find({});
    }
}
