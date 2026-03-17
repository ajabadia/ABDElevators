import { BaseRepository, type SafeFilter } from './BaseRepository';
import { Entity } from '@/lib/schemas';
import { TenantSession } from '@/lib/db-tenant';
import { Filter } from 'mongodb';

/**
 * 🏛️ TechnicalEntityRepository (Era 8)
 * Repositorio para la gestión de entidades técnicas analizadas.
 * Cluster: MAIN
 */
export class OrderRepository extends BaseRepository<Entity> {
    constructor() {
        super('orders');
    }

    /**
     * Busca por hash MD5 para deduplicación.
     */
    async findByHash(md5Hash: string, tenantId: string, session?: TenantSession): Promise<Entity | null> {
        return await this.findOne({ md5Hash, tenantId } as SafeFilter<Entity>, session);
    }
}

export const orderRepository = new OrderRepository();
