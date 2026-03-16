import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { IngestAuditSchema } from '@/lib/schemas';
import { EntityIdSchema } from '@abd/platform-core';

/**
 * 📜 Ingest Audit Service
 * Proposito: Centralizar el registro de auditoría para el sistema de ingesta.
 */
export class IngestAuditService {
    private static COLLECTION = 'audit_ingestion';


    /**
     * Registra un evento de auditoría.
     */
    static async logEvent(data: Record<string, unknown>, session?: TenantSession | null) {
        try {
            const auditCollection = await getTenantCollection(this.COLLECTION, session as any);
            const validated = IngestAuditSchema.parse(data);
            return await auditCollection.insertOne(validated as any);
        } catch (error) {
            console.error('[IngestAuditService] Critical: Failed to log audit event. Error logging system is failing but proceeding to avoid secondary crash.', error);
            // DO NOT THROW. We want to avoid 500 errors caused by the audit system itself.
            return null;
        }
    }

    /**
     * Recupera logs de auditoría para un activo específico.
     */
    static async getLogsByAssetId(assetId: string, session?: TenantSession | null) {
        const auditCollection = await getTenantCollection(this.COLLECTION, session as any);
        const aId = EntityIdSchema.parse(assetId);
        return await auditCollection.find({ docId: aId } as any).sort({ timestamp: -1 }).toArray();
    }
}
