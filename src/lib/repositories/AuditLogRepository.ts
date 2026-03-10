import { BaseRepository } from './BaseRepository';
import { AuditEntry } from '@/services/observability/schemas/AuditSchema';

/**
 * 🏛️ AuditLogRepository
 * Repositorio para logs de auditoría administrativa.
 * Cluster: LOGS
 */
export class AuditLogRepository extends BaseRepository<AuditEntry> {
    constructor() {
        super('audit_admin_ops', 'LOGS');
    }
}

export const auditLogRepository = new AuditLogRepository();
