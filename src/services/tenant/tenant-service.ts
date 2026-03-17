import { z } from 'zod';
import { TenantConfigSchema, TenantConfigBaseSchema, type TenantConfig, TenantIdSchema } from "@/lib/schemas";
import { AppError, NotFoundError } from "@/lib/errors";
import { type ClientSession } from 'mongodb';
import { UserRole } from "@/types/roles";
import { type TenantId, type EntityId } from "@/lib/schemas/common";
import { SecurityService } from "@/services/security/security-service";
import { withCorrelation } from "@/lib/logger/with-correlation";
import { getSystemSession } from "@/lib/sessions/system-session";
import { tenantRepository } from "@/lib/repositories/TenantRepository";

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
        return withCorrelation({ level: 'INFO', source: 'TENANT_SERVICE', action: 'GET_CONFIG' }, async ({ log }) => {
            const tenantId = TenantIdSchema.parse(rawTenantId);
            
            // 1. Check Cache
            const cached = this.cache.get(tenantId);
            if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
                return cached.data;
            }

            // Internal system session for getTenantCollection
            const systemSession = getSystemSession(tenantId);
            const config = await tenantRepository.findByTenantId(tenantId, systemSession);

            if (!config) {
                throw new NotFoundError(`Tenant config not found for ID: ${tenantId}`);
            }

            // 2. Validate & Normalize
            const validated = TenantConfigSchema.parse(config);
            
            // Decrypt sensitive fields
            if (validated.billing?.taxId) {
                validated.billing.taxId = SecurityService.decrypt(validated.billing.taxId);
            }

            // 3. Update Cache & Return
            this.cache.set(tenantId, { data: validated, timestamp: Date.now() });
            return validated;
        });
    }

    /**
     * Updates tenant configuration and records audit entry.
     */
    static async updateConfig(
        rawTenantId: string,
        data: Partial<TenantConfig> | Record<string, unknown>,
        metadata?: { performedBy: string, correlationId?: string, session?: ClientSession }
    ): Promise<TenantConfig> {
        return withCorrelation({ 
            level: 'INFO',
            source: 'TENANT_SERVICE', 
            action: 'UPDATE_CONFIG',
            correlationId: metadata?.correlationId
        }, async ({ log, correlationId }) => {
            const tenantId = TenantIdSchema.parse(rawTenantId);
            const hasDotNotation = Object.keys(data).some(key => key.includes('.'));
            const validated = (hasDotNotation ? data : TenantConfigBaseSchema.partial().parse(data)) as Partial<TenantConfig>;

            // Internal session for collection access
            const authContext = {
                user: {
                    id: (metadata?.performedBy as EntityId) || ('SYSTEM' as EntityId),
                    tenantId,
                    role: UserRole.ADMIN
                }
            };

            const previousState = await tenantRepository.findByTenantId(tenantId, authContext as unknown as any); // tenantRepository expects a specific context type


            const { _id, tenantId: _ign, ...updateData } = validated as Record<string, unknown>;

            // Encrypt sensitive fields
            if (updateData.billing && typeof updateData.billing === 'object') {
                const billing = updateData.billing as Record<string, unknown>;

                if (billing.taxId) {
                    billing.taxId = SecurityService.encrypt(billing.taxId as string);
                }
            }

            await tenantRepository.updateOne(
                { tenantId },
                {
                    $set: {
                        ...updateData,
                        updatedAt: new Date(),
                        updatedBy: metadata?.performedBy || 'SYSTEM'
                    } as Record<string, unknown>,
                } as Record<string, unknown>,
                authContext as unknown as any,

                metadata?.session,
                { upsert: true }
            );

            this.cache.delete(tenantId);

            // Audit
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
                log({ message: 'Failed to log audit trail', level: 'WARN', details: { error: auditError } });
            }

            return validated as TenantConfig;
        });
    }

    /**
     * Lists all registered tenants.
     */
    static async getAllTenants(): Promise<TenantConfig[]> {
        return withCorrelation({ level: 'INFO', source: 'TENANT_SERVICE', action: 'LIST_TENANTS' }, async () => {
            const systemSession = getSystemSession();
            return await tenantRepository.find({}, {}, systemSession);
        });
    }
}
