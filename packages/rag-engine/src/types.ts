
export interface RagResult {
    text: string;
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
}
