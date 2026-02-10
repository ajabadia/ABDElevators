export type IngestionStatus = 'PENDING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type AssetStatus = 'vigente' | 'obsoleto' | 'borrador' | 'archivado' | 'active' | 'obsolete' | 'draft' | 'archived';

export interface KnowledgeAsset {
    _id: string;
    filename: string;
    componentType: string;
    model: string;
    version: string;
    status: AssetStatus;
    ingestionStatus?: IngestionStatus;
    progress?: number;
    attempts?: number;
    error?: string;
    totalChunks: number;
    createdAt: string;
    updatedAt: string;
    tenantId: string;
    description?: string;
    relatedAssets?: Array<{
        targetId: string;
        type: 'SUPERSEDES' | 'COMPLEMENTS' | 'DEPENDS_ON' | 'AMENDS' | 'RELATED_TO';
        description?: string;
    }>;
}
