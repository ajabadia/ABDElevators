import { getTenantCollection } from "@/lib/db-tenant";
import { TenantConfigSchema, type TenantConfig, TenantIdSchema } from "@/lib/schemas";
import { AppError, NotFoundError } from "@/lib/errors";
import { type ClientSession } from 'mongodb';
import { UserRole } from "@/types/roles";
import { type TenantId, type EntityId } from "@/lib/schemas/common";
import { SecurityService } from "@/services/security/security-service";

/**
 * 🏢 TenantService
 * Domain-specific service for tenant management.
 * Standardized for Era 12 (Branded IDs, Relational Integrity).
 */
export class TenantService {
    private static cache = new Map<string, { data: TenantConfig, timestamp: number }>();
    private static CACHE_TTL = 5 * 60 * 1000;

    /**
     * Retrieves tenant configuration.
     */
    static async getConfig(rawTenantId: string): Promise<TenantConfig> {
        const tenantId = TenantIdSchema.parse(rawTenantId);
        try {
            // Internal system session for getTenantCollection
            const systemSession = {
                user: {
                    id: 'system' as EntityId,
                    tenantId,
                    role: UserRole.SUPER_ADMIN // System acts with elevated permissions for config retrieval
                }
            };

            const collection = await getTenantCollection<TenantConfig>('tenants', systemSession as any);
            const config = await collection.findOne({ tenantId });

            if (!config) {
                throw new NotFoundError(`Tenant config not found for ID: ${tenantId}`);
            }

            const validated = TenantConfigSchema.parse(config);
            
            // Decrypt sensitive fields (Rule #13)
            if (validated.billing?.taxId) {
                validated.billing.taxId = SecurityService.decrypt(validated.billing.taxId);
            }

            this.cache.set(tenantId, { data: validated, timestamp: Date.now() });
            return validated;
        } catch (error: unknown) {
            if (error instanceof NotFoundError || error instanceof AppError) throw error;
            console.error(`[TenantService] Error getConfig(${tenantId}):`, error);
            throw new AppError('TENANT_CONFIG_ERROR', 500, 'Error retrieving tenant configuration');
        }
    }

    /**
     * Updates tenant configuration and records audit entry.
     */
    static async updateConfig(
        rawTenantId: string,
        data: Partial<TenantConfig> | Record<string, unknown>,
        metadata?: { performedBy: string, correlationId?: string, session?: ClientSession }
    ): Promise<TenantConfig> {
        const tenantId = TenantIdSchema.parse(rawTenantId);
        const correlationId = metadata?.correlationId || crypto.randomUUID();

        try {
            const hasDotNotation = Object.keys(data).some(key => key.includes('.'));
            const validated = (hasDotNotation ? data : TenantConfigSchema.partial().parse(data)) as Partial<TenantConfig>;

            // Internal session for collection access
            const authContext = {
                user: {
                    id: (metadata?.performedBy as EntityId) || ('SYSTEM' as EntityId),
                    tenantId,
                    role: UserRole.ADMIN
                }
            };

            const collection = await getTenantCollection<TenantConfig>('tenants', authContext as any);
            const previousState = await collection.findOne({ tenantId }, { session: metadata?.session });

            const { _id, tenantId: _ign, ...updateData } = validated as Record<string, unknown>;

            // Encrypt sensitive fields (Rule #13)
            if (updateData.billing && typeof updateData.billing === 'object') {
                const billing = updateData.billing as any;
                if (billing.taxId) {
                    billing.taxId = SecurityService.encrypt(billing.taxId);
                }
            }

            await collection.updateOne(
                { tenantId },
                {
                    $set: {
                        ...updateData,
                        updatedAt: new Date(),
                        updatedBy: metadata?.performedBy || 'SYSTEM'
                    } as any
                } as any,
                { upsert: true, session: metadata?.session }
            );

            this.cache.delete(tenantId);

            // Audit via internal dynamic import
            try {
                const auditTrailModule = await import('@/services/observability/AuditTrailService');
                if (auditTrailModule?.AuditTrailService) {
                    await auditTrailModule.AuditTrailService.logConfigChange({
                        actorId: metadata?.performedBy || 'SYSTEM',
                        actorType: 'USER',
                        tenantId,
                        action: 'UPDATE_TENANT_CONFIG',
                        entityType: 'TENANT',
                        entityId: tenantId,
                        changes: {
                            before: previousState as unknown as Record<string, unknown>,
                            after: validated as Record<string, unknown>
                        },
                        correlationId
                    }, metadata?.session);
                }
            } catch (auditError) {
                console.warn('[TenantService] Failed to log audit trail:', auditError);
            }

            return validated as TenantConfig;
        } catch (error: unknown) {
            console.error(`[TenantService] Error updateConfig(${tenantId}):`, error);
            throw error;
        }
    }

    /**
     * Lists all registered tenants.
     */
    static async getAllTenants(): Promise<TenantConfig[]> {
        // Standardized system session for global access
        const systemSession = {
            user: {
                id: '000000000000000000000000',
                tenantId: '000000000000000000000000',
                role: UserRole.SUPER_ADMIN
            }
        };
        const collection = await getTenantCollection<TenantConfig>('tenants', systemSession as unknown as Parameters<typeof getTenantCollection>[1]);
        const results = await collection.find({});
        return results as TenantConfig[];
    }
}
