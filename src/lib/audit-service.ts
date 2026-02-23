import { getTenantCollection } from '@/lib/db-tenant';
import { AuditTrail, AuditTrailSchema } from '@/lib/schemas';
import { randomUUID } from 'crypto';

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
        } catch (error) {
            console.error('[AuditService] Failed to record audit trail:', error);
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
        before: any;
        after: any;
        correlationId: string;
    }): Promise<void> {
        const { userId, tenantId, action, entityType, entityId, before, after, correlationId } = params;

        await this.record({
            actorId: userId,
            actorType: 'USER',
            tenantId,
            action: `${action}_${entityType}`,
            entityType: entityType === 'LIMITS' ? 'SYSTEM' : entityType as any,
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
            } as any);
        } catch (e) {
            console.error('[AuditService] Failed to record to audit_config_changes:', e);
        }
    }

    static generateCorrelationId(): string {
        try {
            return randomUUID();
        } catch (e) {
            return Math.random().toString(36).substring(2, 15);
        }
    }
}
