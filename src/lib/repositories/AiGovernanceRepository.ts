import { BaseRepository } from './BaseRepository';
import { AiGovernanceConfig } from '@/lib/schemas/governance';
import { TenantId } from '@/lib/schemas/common';

/**
 * 🗺️ AiGovernanceRepository
 * Era 16: Access point for AI steering configurations.
 */
export class AiGovernanceRepository extends BaseRepository<AiGovernanceConfig> {
    constructor() {
        super('ai_governance_configs', 'CONFIG');
    }

    async findByTask(tenantId: TenantId, task: string): Promise<AiGovernanceConfig | null> {
        return await this.findOne({ tenantId: tenantId as any, task } as any);
    }

    async findByTenant(tenantId: TenantId): Promise<AiGovernanceConfig | null> {
        return await this.findOne({ tenantId: tenantId as any } as any);
    }

    async save(config: AiGovernanceConfig): Promise<void> {
        const existing = await this.findByTask(config.tenantId as any, config.task);
        if (existing) {
            await this.update(existing._id!, { $set: { ...config, updatedAt: new Date() } } as any);
        } else {
            await this.create(config as any);
        }
    }
}

export const aiGovernanceRepository = new AiGovernanceRepository();
