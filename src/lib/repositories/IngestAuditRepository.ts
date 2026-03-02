import { BaseRepository } from './BaseRepository';
import { IngestAudit } from '@/lib/schemas';

/**
 * 🏛️ IngestAuditRepository
 * Repositorio para auditorías de ingesta.
 * Cluster: LOGS
 */
export class IngestAuditRepository extends BaseRepository<IngestAudit> {
    protected readonly collectionName = 'ingest_audits';
    protected readonly clusterName = 'LOGS';
}

export const ingestAuditRepository = new IngestAuditRepository();
