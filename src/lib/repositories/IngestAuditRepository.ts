import { BaseRepository } from './BaseRepository';
import { IngestAudit } from '@/lib/schemas';

/**
 * 🏛️ IngestAuditRepository
 * Repositorio para auditorías de ingesta.
 * Cluster: LOGS
 */
export class IngestAuditRepository extends BaseRepository<IngestAudit> {
    constructor() {
        super('ingest_audits', 'LOGS');
    }
}

export const ingestAuditRepository = new IngestAuditRepository();
