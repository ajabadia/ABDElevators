import { getTenantCollection } from '@/lib/db-tenant';
import { AuditTrail, AuditTrailSchema } from '@/lib/schemas';

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

            await auditCollection.insertOne(validatedEntry as AuditTrail);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[AuditService] Failed to record audit trail:', errorMessage);
        }
    }

    /**
     * Records a specific configuration change (Tenant, Prompt, or Limits).
     */
    static async recordConfigChange(params: {
        userId: string;
        tenantId: string;
        action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE';
        entityType: 'TENANT' | 'PROMPT' | 'LIMITS' | 'SYSTEM';
        entityId: string;
        before: unknown;
        after: unknown;
        correlationId: string;
    }): Promise<void> {
        const { userId, tenantId, action, entityType, entityId, before, after, correlationId } = params;

        await this.record({
            actorId: userId,
            actorType: 'USER',
            tenantId,
            action: `${action}_${entityType}`,
            entityType: entityType === 'LIMITS' ? 'SYSTEM' : entityType as 'TENANT' | 'PROMPT' | 'SYSTEM',
            entityId,
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
            });
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error('[AuditService] Failed to record to audit_config_changes:', errorMessage);
        }
    }

    static generateCorrelationId(): string {
        try {
            return globalThis.crypto.randomUUID();
        } catch (e) {
            return Math.random().toString(36).substring(2, 15);
        }
    }
}
