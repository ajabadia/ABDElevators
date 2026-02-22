import { AuditSchema, AuditEntry } from './schemas/AuditSchema';
import { ObservabilityRepository } from './ObservabilityRepository';
import { LoggingService } from './LoggingService';
import crypto from 'crypto';

/**
 * 🛡️ AuditTrailService
 * Business-critical audit trails for compliance and risk management.
 */
export class AuditTrailService {

    /**
     * Records a raw audit entry.
     */
    private static async record(
        collection: 'audit_config_changes' | 'audit_admin_ops' | 'audit_data_access' | 'audit_trails' | 'audit_security_events' | 'audit_billing',
        entry: Omit<AuditEntry, '_id' | 'timestamp'>
    ): Promise<void> {
        const correlationId = entry.correlationId || crypto.randomUUID();

        try {
            const validated = AuditSchema.parse({
                ...entry,
                correlationId,
                timestamp: new Date()
            });

            await ObservabilityRepository.saveAudit(collection, validated as AuditEntry);

        } catch (error: any) {
            // Fallback to technical logs if audit recording fails
            await LoggingService.error('AUDIT_TRAIL_SERVICE', 'RECORD_FAILURE',
                `Critical: Failed to record audit in ${collection}`,
                error,
                correlationId
            );
        }
    }

    /**
     * Helper to extract context from headers.
     */
    private static getContext(headers?: Headers) {
        return {
            ip: headers?.get('x-forwarded-for')?.split(',')[0] || headers?.get('x-real-ip') || undefined,
            userAgent: headers?.get('user-agent') || undefined
        };
    }

    /**
     * Audit: Configuration or policy changes.
     */
    static async logConfigChange(entry: Omit<AuditEntry, '_id' | 'timestamp' | 'source' | 'ip' | 'userAgent'>, headers?: Headers) {
        return this.record('audit_config_changes', {
            ...entry,
            source: 'CONFIG_CHANGE',
            ...this.getContext(headers)
        });
    }

    /**
     * Audit: Administrative operations.
     */
    static async logAdminOp(entry: Omit<AuditEntry, '_id' | 'timestamp' | 'source' | 'ip' | 'userAgent'>, headers?: Headers) {
        return this.record('audit_admin_ops', {
            ...entry,
            source: 'ADMIN_OP',
            ...this.getContext(headers)
        });
    }

    /**
     * Audit: Security-sensitive events.
     */
    static async logSecurityEvent(entry: Omit<AuditEntry, '_id' | 'timestamp' | 'source' | 'ip' | 'userAgent'>, headers?: Headers) {
        return this.record('audit_security_events', {
            ...entry,
            source: 'SECURITY_EVENT',
            ...this.getContext(headers)
        });
    }

    /**
     * Audit: Billing and quota adjustments.
     */
    static async logBillingEvent(entry: Omit<AuditEntry, '_id' | 'timestamp' | 'source' | 'ip' | 'userAgent'>, headers?: Headers) {
        return this.record('audit_billing', {
            ...entry,
            source: 'BILLING_EVENT',
            ...this.getContext(headers)
        });
    }
}
