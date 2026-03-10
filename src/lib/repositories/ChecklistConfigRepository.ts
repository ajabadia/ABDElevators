import { BaseRepository } from './BaseRepository';
import { ChecklistConfigSchema, type ChecklistConfig } from '@/lib/schemas';
import { type ClientSession } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';

/**
 * 🏛️ ChecklistConfigRepository
 * Repositorio centralizado para configuraciones de checklist.
 * Hardened Era 8: Strict types and transaction support.
 */
export class ChecklistConfigRepository extends BaseRepository<ChecklistConfig> {
    constructor() {
        super('configs_checklist', 'MAIN');
    }
}

export const checklistConfigRepository = new ChecklistConfigRepository();
