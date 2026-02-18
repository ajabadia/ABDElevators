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
     * Records an event with context (IP, User Agent) from headers if available.
     */
    static async recordWithContext(
        collectionName: 'audit_config_changes' | 'audit_admin_ops' | 'audit_data_access' | 'audit_trails' | 'audit_security_events',
        entry: Omit<AuditTrail, '_id' | 'timestamp' | 'ip' | 'userAgent'>,
        headers?: Headers
    ): Promise<void> {
        const ip = headers?.get('x-forwarded-for')?.split(',')[0] || headers?.get('x-real-ip') || undefined;
        const userAgent = headers?.get('user-agent') || undefined;

        return this.record(collectionName as any, {
            ...entry,
            ip,
            userAgent
        });
    }

    /**
     * Logs changes to configurations or policies.
     */
    static async logConfigChange(entry: Omit<AuditTrail, '_id' | 'timestamp' | 'source'>, headers?: Headers) {
        return this.recordWithContext('audit_config_changes', { ...entry, source: 'CONFIG_CHANGE' }, headers);
    }

    /**
     * Logs administrative operations (seed, maintenance, etc).
     */
    static async logAdminOp(entry: Omit<AuditTrail, '_id' | 'timestamp' | 'source'>, headers?: Headers) {
        return this.recordWithContext('audit_admin_ops', { ...entry, source: 'ADMIN_OP' }, headers);
    }

    /**
     * Logs sensitive data access.
     */
    static async logDataAccess(entry: Omit<AuditTrail, '_id' | 'timestamp' | 'source'>, headers?: Headers) {
        return this.recordWithContext('audit_data_access', { ...entry, source: 'DATA_ACCESS' }, headers);
    }

    /**
     * Logs security related events.
     */
    static async logSecurityEvent(entry: Omit<AuditTrail, '_id' | 'timestamp' | 'source'>, headers?: Headers) {
        return this.recordWithContext('audit_security_events', { ...entry, source: 'SECURITY_EVENT' }, headers);
    }
}
