import { getTenantCollection } from '@/lib/db-tenant';
import { AuditTrail, AuditTrailSchema } from '@/lib/schemas/system';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * AuditTrailService provides a unified way to record high-impact events.
 * It ensures that every critical action follows a predictable audit structure.
 */
export class AuditTrailService {

    /**
     * Records an event in a specialized audit collection.
     */
    private static async record(
        collectionName: 'audit_config_changes' | 'audit_admin_ops' | 'audit_data_access' | 'audit_trails',
        entry: Omit<AuditTrail, '_id' | 'timestamp'>
    ): Promise<void> {
        const correlationId = entry.correlationId || crypto.randomUUID();

        try {
            const collection = await getTenantCollection<AuditTrail>(collectionName, null, 'LOGS');

            const validated = AuditTrailSchema.parse({
                ...entry,
                correlationId,
                timestamp: new Date()
            });

            await collection.insertOne(validated as any);

        } catch (error: any) {
            // Fallback to application logs if audit recording fails
            await logEvento({
                level: 'ERROR',
                source: 'AUDIT_TRAIL_SERVICE',
                action: 'RECORD_FAILURE',
                message: `Failed to record audit in ${collectionName}: ${error.message}`,
                correlationId,
                details: { entry, error: error.issues || error.message }
            });
        }
    }

    /**
     * Logs changes to configurations or policies.
     */
    static async logConfigChange(entry: Omit<AuditTrail, '_id' | 'timestamp' | 'source'>) {
        return this.record('audit_config_changes', { ...entry, source: 'CONFIG_CHANGE' });
    }

    /**
     * Logs administrative operations (seed, maintenance, etc).
     */
    static async logAdminOp(entry: Omit<AuditTrail, '_id' | 'timestamp' | 'source'>) {
        return this.record('audit_admin_ops', { ...entry, source: 'ADMIN_OP' });
    }

    /**
     * Logs sensitive data access.
     */
    static async logDataAccess(entry: Omit<AuditTrail, '_id' | 'timestamp' | 'source'>) {
        return this.record('audit_data_access', { ...entry, source: 'DATA_ACCESS' });
    }
}
