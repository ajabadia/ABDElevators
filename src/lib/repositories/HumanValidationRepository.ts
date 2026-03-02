import { BaseRepository } from './BaseRepository';
import { HumanValidation } from '@/lib/schemas/system';

/**
 * 🏛️ HumanValidationRepository
 * Repositorio para validaciones humanas.
 * Cluster: LOGS
 */
export class HumanValidationRepository extends BaseRepository<HumanValidation> {
    protected readonly collectionName = 'human_validations';
    protected readonly clusterName = 'LOGS';
}

export const humanValidationRepository = new HumanValidationRepository();
