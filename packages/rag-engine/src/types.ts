
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
    relatedAssets?: any[];
}
