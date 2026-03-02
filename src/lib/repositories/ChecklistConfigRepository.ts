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
    protected readonly collectionName = 'configs_checklist';
}

export const checklistConfigRepository = new ChecklistConfigRepository();
