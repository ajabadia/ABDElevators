import { EntityId, TenantId } from '@abd/platform-core';

export interface RagChunkHit {
    id: EntityId;             // id del AssetChunk
    assetId: EntityId;        // id del KnowledgeAsset
    spaceId: EntityId;        // para filtros por espacio
    score: number;            // similitud / relevancia
    highlight?: string;       // snippet opcional para UI
}

export interface RagQueryResult {
    modelId: string;
    chunks: RagChunkHit[];
    answer?: string;          // respuesta generada (si aplica)
}

export interface RagResult extends RagQueryResult {
    text: string;           // Deprecated: use answer
    source: string;
    score?: number;
    type: string;
    model: string;
    cloudinaryUrl?: string;
    language?: string;
    originalLang?: string;
    isShadow?: boolean;
    chunkType?: string;
    approxPage?: number;
    chunkId?: string;
    assetId?: string;
    relatedAssets?: any[];
    feedbackScore?: number;
    graphData?: any;
    // Phase 306: Hierarchical RAG
    profileId?: string;
    sectionId?: string;
    sectionTitle?: string;
    sectionLevel?: number;
    sectionSummary?: string;
}
