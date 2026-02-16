import { KnowledgeAsset, IndustryType } from '@/lib/schemas';

export interface IKnowledgeRepository {
    findById(id: string): Promise<KnowledgeAsset | null>;
    findByMd5(md5: string, tenantId: string): Promise<KnowledgeAsset | null>;
    findByHash(hash: string, tenantId: string): Promise<KnowledgeAsset | null>;
    create(data: KnowledgeAsset): Promise<KnowledgeAsset>;
    save(asset: KnowledgeAsset): Promise<KnowledgeAsset>;
    updateStatus(id: string, status: KnowledgeAsset['ingestionStatus'], details?: Partial<KnowledgeAsset>): Promise<void>;
    updateProgress(id: string, progress: number): Promise<void>;
    findActiveByIndustry(industry: IndustryType, tenantId: string): Promise<KnowledgeAsset[]>;
    search(query: string, tenantId: string): Promise<KnowledgeAsset[]>;
    findAll(params: { tenantId?: string, limit: number, skip: number }): Promise<{ assets: KnowledgeAsset[], total: number }>;
}
