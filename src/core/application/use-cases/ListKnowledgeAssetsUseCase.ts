import { IKnowledgeRepository } from '../../domain/repositories/IKnowledgeRepository';
import { KnowledgeAsset } from '@/lib/schemas';

export class ListKnowledgeAssetsUseCase {
    constructor(private knowledgeRepo: IKnowledgeRepository) { }

    async execute(params: {
        tenantId?: string,
        limit: number,
        skip: number,
        userRole: string
    }): Promise<{ assets: KnowledgeAsset[], total: number }> {

        // Logic: SuperAdmin can potentially list all if tenantId is not provided?
        // Current requirement: "SuperAdmin sees all, Admin/Engineering only their tenant"
        // The Controller passed tenantId based on role. 
        // If Controller passes undefined for SuperAdmin, Repository should handle it.
        // But SecureCollection might require a tenantId context.

        // If SuperAdmin and no tenantId specified (global view), passing undefined to repo might work 
        // if repo handles it or if SecureCollection allows unauthorized listing (unlikely).
        // Best approach: If SuperAdmin, they usually simulate a tenant or see 'platform_master'.
        // Or if they want ALL, SecureCollection needs 'isSuperAdmin' flag.

        // For now, passing whatever the controller decided is the scope.
        return await this.knowledgeRepo.findAll({
            tenantId: params.tenantId,
            limit: params.limit,
            skip: params.skip
        });
    }
}
