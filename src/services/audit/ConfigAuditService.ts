import { getTenantCollection } from '@/lib/db-tenant';

export interface AuditEvent {
    _id: string;
    timestamp: Date;
    actor: {
        email: string;
        role: string;
        ip?: string;
    };
    action: string;
    target: string;
    changes: {
        field: string;
        oldValue: any;
        newValue: any;
    }[];
    reason?: string;
}

export class ConfigAuditService {
    /**
     * Retrieves the history of configuration changes.
     */
    static async getHistory(limit = 50, session?: any): Promise<AuditEvent[]> {
        // RULE #11: Use getTenantCollection for isolation
        // Using 'audit_logs' (mapped to LOGS db or AUTH depending on configuration, but handled by helper)
        const collection = await getTenantCollection<any>('audit_logs', session);

        // We look for audit logs specifically related to configuration changes
        const logs = await collection.find(
            {
                action: { $in: ['CONFIG_CHANGE', 'FEATURE_FLAG_CHANGE', 'PROMPT_UPDATE', 'I18N_UPDATE'] }
            },
            {
                sort: { timestamp: -1 },
                limit: limit
            }
        );

        return logs.map(log => ({
            _id: log._id.toString(),
            timestamp: log.timestamp,
            actor: log.actor || { email: 'system', role: 'SYSTEM' },
            action: log.action,
            target: log.target || 'Generico',
            changes: log.details?.changes || [], // Assuming standard audit format stores diff in details.changes
            reason: log.details?.reason
        }));
    }
}
