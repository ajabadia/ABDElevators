import { getTenantCollection } from '@/lib/db-tenant';
import type { AuditTrail, EntityId, TenantId } from '@/lib/schemas';
import { AuditTrailSchema } from '@/lib/schemas';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';

// 🛡️ Edge Runtime Compatibility: Use globalThis.crypto instead of 'crypto' module.

/**
 * AuditService provides banking-grade traceability for system state changes.
 * Every critical action must be recorded via this service.
 */
export class AuditService {
    /**
     * Records an audit trail entry.
     */
    static async record(entry: Omit<AuditTrail, 'timestamp' | '_id'>): Promise<void> {
        try {
            const auditCollection = await getTenantCollection<AuditTrail>('audit_trails', null, 'LOGS');

            const validatedEntry = AuditTrailSchema.parse({
                ...entry,
                timestamp: new Date()
            });

            await auditCollection.insertOne(validatedEntry as any);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[AuditService] Failed to record audit trail:', errorMessage);
        }
    }

    /**
     * Records a specific configuration change (Tenant, Prompt, or Limits).
     */
    static async recordConfigChange(params: {
        userId: EntityId;
        tenantId: TenantId;
        action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE';
        entityType: 'TENANT' | 'PROMPT' | 'LIMITS' | 'SYSTEM';
        entityId: EntityId | string;
        before: unknown;
        after: unknown;
        correlationId: string;
    }): Promise<void> {
        const { userId, tenantId, action, entityType, entityId, before, after, correlationId } = params;

        await this.record({
            actorId: userId as any,
            actorType: 'USER',
            tenantId: tenantId as any,
            action: `${action}_${entityType}`,
            entityType: entityType === 'LIMITS' ? 'SYSTEM' : entityType as 'TENANT' | 'PROMPT' | 'SYSTEM',
            entityId: entityId as any,
            changes: { before, after },
            correlationId,
            source: 'CONFIG_CHANGE'
        });

        // 🛡️ Phase 2302: Specialized collection for quick config audit
        try {
            const configAuditCollection = await getTenantCollection('audit_config_changes', null, 'LOGS');
            await configAuditCollection.insertOne({
                ...params,
                timestamp: new Date()
            } as any);
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error('[AuditService] Failed to record to audit_config_changes:', errorMessage);
        }
    }

    static generateCorrelationId(): string {
        try {
            return CorrelationIdService.generate();
        } catch (e) {
            return Math.random().toString(36).substring(2, 15);
        }
    }

    /**
     * Retrieves audit logs for a specific tenant.
     */
    static async getLogs(tenantId: TenantId, limit: number = 50, offset: number = 0): Promise<AuditTrail[]> {
        try {
            const auditCollection = await getTenantCollection<AuditTrail>('audit_trails', null, 'LOGS');
            return await auditCollection.find(
                { tenantId: tenantId as any },
                {
                    sort: { timestamp: -1 } as any,
                    skip: offset,
                    limit: limit
                }
            ) as unknown as AuditTrail[];
        } catch (error: unknown) {
            console.error('[AuditService] Failed to fetch logs:', error);
            return [];
        }
    }

    /**
     * Retrieves compliance-specific logs (e.g., config changes, governance events).
     */
    static async getComplianceLogs(tenantId: TenantId, limit: number = 20): Promise<AuditTrail[]> {
        try {
            const auditCollection = await getTenantCollection<AuditTrail>('audit_trails', null, 'LOGS');
            return await auditCollection.find(
                {
                    tenantId: tenantId as any,
                    entityType: { $in: ['TENANT', 'GOVERNANCE', 'SYSTEM', 'PROMPT'] } as any
                },
                {
                    sort: { timestamp: -1 } as any,
                    limit: limit
                }
            ) as unknown as AuditTrail[];
        } catch (error: unknown) {
            console.error('[AuditService] Failed to fetch compliance logs:', error);
            return [];
        }
    }
}

