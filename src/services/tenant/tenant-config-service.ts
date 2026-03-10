import { getTenantCollection } from "@/lib/db-tenant";
import { TenantConfigSchema, TenantConfig } from "@/lib/schemas";
import { AppError, NotFoundError } from "@/lib/errors";
import { logEvento } from "@/lib/logger";
import { ClientSession } from 'mongodb';
import { TenantIdSchema } from "@/lib/schemas/common";

export class TenantConfigService {
    private static cache = new Map<string, { data: TenantConfig, timestamp: number }>();
    private static CACHE_TTL = 5 * 60 * 1000;

    static async getConfig(rawTenantId: string) {
        const tenantId = TenantIdSchema.parse(rawTenantId);
        const correlationId = `sys-get-config-${tenantId}-${Date.now()}`;

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
        } catch (error: unknown) {
            if (error instanceof NotFoundError) throw error;
            throw new AppError('TENANT_CONFIG_ERROR', 500, 'Error al recuperar configuración del tenant');
        }
    }

    static async updateConfig(
        rawTenantId: string,
        data: Partial<TenantConfig>,
        metadata?: { performedBy: string, correlationId?: string, session?: ClientSession }
    ): Promise<TenantConfig> {
        const tenantId = TenantIdSchema.parse(rawTenantId);
        const correlationId = metadata?.correlationId || crypto.randomUUID();

        try {
            const validated = TenantConfigSchema.partial().parse(data);
            const authSession = { user: { id: metadata?.performedBy || 'SYSTEM', tenantId, role: 'USER' } } as any;
            const collection = await getTenantCollection<TenantConfig>('tenants', authSession);
            const previousState = await collection.findOne({ tenantId });

            const { _id, tenantId: _ign, ...updateData } = validated;
            await collection.updateOne(
                { tenantId },
                { $set: { ...updateData, updatedAt: new Date() } },
                { upsert: true, session: metadata?.session }
            );

            this.cache.delete(tenantId);

            // Audit via internal dynamic import to avoid circular dependency
            const { AuditTrailService } = await import('@/services/observability/AuditTrailService').catch(() => ({ AuditTrailService: null }));
            if (AuditTrailService) {
                await AuditTrailService.logConfigChange({
                    actorType: 'SYSTEM',
                    actorId: metadata?.performedBy || 'SYSTEM',
                    tenantId,
                    action: 'UPDATE_TENANT_CONFIG',
                    changes: { before: previousState as unknown as Record<string, unknown>, after: validated as Record<string, unknown> },
                    correlationId,
                    entityType: 'TENANT',
                    entityId: tenantId
                });
            }

            return validated as TenantConfig;
        } catch (error: unknown) {
            throw error;
        }
    }

    static async getAllTenants() {
        const session = { user: { role: 'SUPER_ADMIN', tenantId: 'platform_master' } } as any;
        const collection = await getTenantCollection('tenants', session);
        return await collection.find({});
    }
}
