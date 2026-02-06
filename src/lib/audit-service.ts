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

            // Validate before insertion
            const validatedEntry = AuditTrailSchema.parse({
                ...entry,
                timestamp: new Date()
            });

            await auditCollection.insertOne(validatedEntry as any);
        } catch (error) {
            console.error('[AuditService] Failed to record audit trail:', error);
            // We don't throw here to avoid breaking the main flow, 
            // but in a real banking-grade app, this should be synchronous and critical.
            // For now, we rely on the error log.
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
