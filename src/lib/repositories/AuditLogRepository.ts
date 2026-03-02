import { BaseRepository } from './BaseRepository';
import { AuditTrail } from '@/lib/schemas/system';

/**
 * 🏛️ AuditLogRepository
 * Repositorio para logs de auditoría administrativa.
 * Cluster: LOGS
 */
export class AuditLogRepository extends BaseRepository<AuditTrail> {
    protected readonly collectionName = 'audit_admin_ops';
    protected readonly clusterName = 'LOGS';
}

export const auditLogRepository = new AuditLogRepository();
