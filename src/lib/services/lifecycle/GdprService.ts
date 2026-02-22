
import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { AuditTrailService } from '../audit-trail-service';
import { CorrelationIdService } from '@/services/common/CorrelationIdService';

/**
 * 🛡️ GDPR Service
 * Proposito: Implementación del Derecho al Olvido y cumplimiento normativo.
 */
export class GdprService {
    private static NUCLEAR_COLLECTIONS = ['entities', 'knowledge_assets', 'usage_logs', 'human_validations', 'user_collections'];

    /**
     * Elimina todos los datos de un Tenant o Usuario (Derecho al Olvido).
     */
    static async rightToBeForgotten(tenantId: string, userId?: string): Promise<{ success: boolean }> {
        const correlationId = CorrelationIdService.generate();

        await logEvento({
            level: 'INFO',
            source: 'GDPR_SERVICE',
            action: 'FORGET_START',
            message: `Nuclear wipe for ${userId ? `user ${userId}` : `tenant ${tenantId}`}`,
            correlationId,
            tenantId
        });

        const filter = userId ? { userId } : { tenantId };

        for (const collName of this.NUCLEAR_COLLECTIONS) {
            const coll = await getTenantCollection(collName, null, 'MAIN');
            await coll.deleteMany(filter, { hardDelete: true });
        }

        await AuditTrailService.logAdminOp({
            actorType: 'SYSTEM',
            actorId: 'GDPR_SERVICE',
            tenantId,
            action: 'GDPR_FORGET',
            entityType: userId ? 'USER' : 'TENANT',
            entityId: userId || tenantId,
            reason: 'GDPR Compliance Wipe',
            correlationId
        } as any);

        return { success: true };
    }
}
