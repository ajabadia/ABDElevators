import { getTenantCollection } from '@/lib/db-tenant';
import { AppEvent } from './schemas/EventSchema';
import { AuditEntry } from './schemas/AuditSchema';

/**
 * 🗄️ Observability Repository
 * Centralized DB access for the LOGS cluster.
 * Rule #11: Multi-tenant Harmony via getTenantCollection.
 */
export class ObservabilityRepository {
    private static readonly LOGS_DB = 'LOGS';

    /**
     * Stores a technical application log.
     */
    static async saveLog(event: AppEvent): Promise<void> {
        const collection = await getTenantCollection<AppEvent>('application_logs', null, this.LOGS_DB);
        await collection.insertOne(event as any);
    }

    /**
     * Stores a business audit entry in the specified collection.
     */
    static async saveAudit(
        collectionName: 'audit_config_changes' | 'audit_admin_ops' | 'audit_data_access' | 'audit_trails' | 'audit_security_events' | 'audit_billing',
        entry: AuditEntry
    ): Promise<void> {
        const collection = await getTenantCollection<AuditEntry>(collectionName, null, this.LOGS_DB);
        await collection.insertOne(entry as any);
    }
}
