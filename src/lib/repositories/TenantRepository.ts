import { BaseRepository, type SafeFilter } from './BaseRepository';
import { type TenantConfig } from '@/lib/schemas';
import { type TenantSession } from '@/lib/db-tenant';

/**
 * 🏢 TenantRepository
 * Repository for tenant configuration management.
 * Cluster: CONFIG
 */
export class TenantRepository extends BaseRepository<TenantConfig> {
    constructor() {
        super('tenants', 'CONFIG');
    }

    /**
     * Finds a tenant configuration by its tenantId.
     */
    async findByTenantId(tenantId: string, session?: TenantSession): Promise<TenantConfig | null> {
        return await this.findOne({ tenantId }, session);
    }
}

export const tenantRepository = new TenantRepository();
