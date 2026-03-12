import { getTenantCollection, type TenantSession } from "@/lib/db-tenant";
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

        try {
            const session = { user: { id: '000000000000000000000000', tenantId, role: 'SYSTEM', email: 'system@platform.local' } } as unknown as TenantSession;
            const collection = await getTenantCollection<TenantConfig>('tenants', session);
            const config = await collection.findOne({ tenantId });

            if (!config) {
                throw new NotFoundError(`Tenant config not found for ID: ${tenantId}`);
            }

            const validated = TenantConfigSchema.parse(config);
            this.cache.set(tenantId, { data: validated, timestamp: Date.now() });

            return validated;
        } catch (error: unknown) {
            if (error instanceof NotFoundError) throw error;
            throw new AppError('TENANT_CONFIG_ERROR', 500, 'Error retrieving tenant configuration');
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
            const authSession = {
                user: {
                    id: metadata?.performedBy || '000000000000000000000000',
                    tenantId,
                    role: 'USER',
                    email: 'system@platform.local'
                }
            } as unknown as TenantSession;

            const collection = await getTenantCollection<TenantConfig>('tenants', authSession);
            const previousState = await collection.findOne({ tenantId });

            const { tenantId: _ign, ...updateData } = validated;
            await collection.updateOne(
                { tenantId } as any,
                { $set: { ...updateData, updatedAt: new Date() } },
                { upsert: true, session: metadata?.session }
            );

            this.cache.delete(tenantId);

            // Audit via internal dynamic import to avoid circular dependency
            const { AuditTrailService } = await import('@/services/observability/AuditTrailService').catch(() => ({ AuditTrailService: null })) as any;
            if (AuditTrailService) {
                await AuditTrailService.logConfigChange({
                    actorType: 'SYSTEM',
                    actorId: metadata?.performedBy || '000000000000000000000000',
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
        const session = {
            user: {
                role: 'SUPER_ADMIN',
                tenantId: '000000000000000000000000',
                id: '000000000000000000000000',
                email: 'admin@platform.local'
            }
        } as unknown as TenantSession;
        const collection = await getTenantCollection<TenantConfig>('tenants', session);
        return await collection.find({});
    }
}
