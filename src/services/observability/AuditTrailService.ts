import { AuditSchema, AuditEntry } from './schemas/AuditSchema';
import { ObservabilityRepository } from './ObservabilityRepository';
import { LoggingService } from './LoggingService';
import { ClientSession } from 'mongodb';
import { TenantSession } from '@/lib/db-tenant';
import { CorrelationIdService } from './CorrelationIdService';

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
        entry: Omit<AuditEntry, '_id' | 'timestamp'>,
        sessionOrHeaders?: ClientSession | TenantSession | Headers
    ): Promise<void> {
        let session: ClientSession | undefined;
        let headers: Headers | undefined;

        if (sessionOrHeaders instanceof Headers) {
            headers = sessionOrHeaders;
        } else if (sessionOrHeaders && typeof sessionOrHeaders === 'object') {
            if ('client' in sessionOrHeaders) {
                session = sessionOrHeaders as ClientSession;
            } else if ('user' in (sessionOrHeaders as any)) {
                // It's a TenantSession, the MongoDB session might be injected in some contexts
                session = (sessionOrHeaders as any).originalSession || (sessionOrHeaders as any).session;
            }
        }
        const correlationId = entry.correlationId || CorrelationIdService.generate();

        try {
            const validated = AuditSchema.parse({
                ...entry,
                correlationId,
                timestamp: new Date()
            });

            await ObservabilityRepository.saveAudit(collection, validated as AuditEntry, session);

        } catch (error: unknown) {
            // Fallback to technical logs if audit recording fails
            await LoggingService.error('AUDIT_TRAIL_SERVICE', 'RECORD_FAILURE',
                `Critical: Failed to record audit in ${collection}`,
                error instanceof Error ? error : new Error(String(error)),
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
    static async logConfigChange(
        entry: Omit<AuditEntry, '_id' | 'timestamp' | 'source' | 'ip' | 'userAgent'>,
        sessionOrHeaders?: TenantSession | ClientSession | Headers
    ) {
        let headers: Headers | undefined;
        let session: ClientSession | undefined;

        if (sessionOrHeaders instanceof Headers) {
            headers = sessionOrHeaders;
        } else if (sessionOrHeaders && typeof sessionOrHeaders === 'object' && 'client' in sessionOrHeaders) {
            // It's a ClientSession (MongoDB)
            session = sessionOrHeaders as ClientSession;
        } else if (sessionOrHeaders && typeof sessionOrHeaders === 'object' && 'user' in sessionOrHeaders) {
            // It's a TenantSession, but logConfigChange record() currently takes ClientSession for MongoDB transaction
            // No direct mapping needed for session right now unless we want to propagate the transaction.
        }

        return this.record('audit_config_changes', {
            ...entry,
            source: 'CONFIG_CHANGE',
            ...this.getContext(headers)
        }, sessionOrHeaders);
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

    /**
     * Audit: Access to sensitive data (Reports, PII, Validations).
     * ⚡ FASE 304: Bank-grade compliance.
     */
    static async logDataAccess(entry: Omit<AuditEntry, '_id' | 'timestamp' | 'source' | 'ip' | 'userAgent'>, headers?: Headers) {
        return this.record('audit_data_access', {
            ...entry,
            source: 'DATA_ACCESS',
            ...this.getContext(headers)
        });
    }
}
