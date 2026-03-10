import { BaseRepository } from './BaseRepository';
import { Entity } from '@/lib/schemas';
import { TenantSession } from '@/lib/db-tenant';
import { Filter } from 'mongodb';

/**
 * 🏛️ TechnicalEntityRepository (Era 8)
 * Repositorio para la gestión de entidades técnicas analizadas.
 * Cluster: MAIN
 */
export class TechnicalEntityRepository extends BaseRepository<Entity> {
    constructor() {
        super('entities');
    }

    /**
     * Busca por hash MD5 para deduplicación.
     */
    async findByHash(md5Hash: string, tenantId: string, session?: TenantSession): Promise<Entity | null> {
        return await this.findOne({ md5Hash, tenantId } as unknown as Filter<Entity>, {}, session as any);
    }
}

export const technicalEntityRepository = new TechnicalEntityRepository();
