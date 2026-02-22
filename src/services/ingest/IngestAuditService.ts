
import { getTenantCollection } from '@/lib/db-tenant';
import { IngestAuditSchema } from '@/lib/schemas';

/**
 * 📜 Ingest Audit Service
 * Proposito: Centralizar el registro de auditoría para el sistema de ingesta.
 */
export class IngestAuditService {
    private static COLLECTION = 'audit_ingestion';


    /**
     * Registra un evento de auditoría.
     */
    static async logEvent(data: any, session?: any) {
        const auditCollection = await getTenantCollection(this.COLLECTION, session);
        const validated = IngestAuditSchema.parse(data);
        return await auditCollection.insertOne(validated);
    }

    /**
     * Recupera logs de auditoría para un activo específico.
     */
    static async getLogsByAssetId(assetId: string) {
        const auditCollection = await getTenantCollection(this.COLLECTION);
        return await auditCollection.find({ assetId }).sort({ createdAt: -1 }).toArray();
    }
}
