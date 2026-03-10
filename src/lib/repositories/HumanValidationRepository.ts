import { BaseRepository } from './BaseRepository';
import { HumanValidation } from '@/lib/schemas/system';

/**
 * 🏛️ HumanValidationRepository
 * Repositorio para validaciones humanas.
 * Cluster: LOGS
 */
export class HumanValidationRepository extends BaseRepository<HumanValidation> {
    constructor() {
        super('human_validations', 'LOGS');
    }
}

export const humanValidationRepository = new HumanValidationRepository();
