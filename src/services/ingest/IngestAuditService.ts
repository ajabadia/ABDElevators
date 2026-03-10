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
        const auditCollection = await getTenantCollection(this.COLLECTION, session);
        const validated = IngestAuditSchema.parse(data);
        return await auditCollection.insertOne(validated as any);
    }

    /**
     * Recupera logs de auditoría para un activo específico.
     */
    static async getLogsByAssetId(assetId: string) {
        const auditCollection = await getTenantCollection(this.COLLECTION);
        const aId = EntityIdSchema.parse(assetId);
        const docs = await auditCollection.find({ assetId: aId } as any);
        return (docs as any[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
}
