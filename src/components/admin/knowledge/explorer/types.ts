export interface Chunk {
    _id: string;
    chunkText: string;
    sourceDoc: string;
    model: string;
    componentType: string;
    language: string;
    environment: string;
    chunkType?: 'TEXT' | 'VISUAL';
    approxPage?: number;
    isShadow?: boolean;
    originalLang?: string;
    translatedText?: string;
    createdAt: string;
}
