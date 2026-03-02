import { BaseRepository } from './BaseRepository';
import { ApplicationLog } from '@/lib/schemas/system';

/**
 * 🏛️ ApplicationLogRepository
 * Repositorio para logs técnicos de la aplicación.
 * Cluster: LOGS
 */
export class ApplicationLogRepository extends BaseRepository<ApplicationLog> {
    protected readonly collectionName = 'application_logs';
    protected readonly clusterName = 'LOGS';
}

export const applicationLogRepository = new ApplicationLogRepository();
