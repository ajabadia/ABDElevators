// Phase 131: Extended Ingestion Status for granular retry
export type IngestionStatus = 
    | 'PENDING' 
    | 'QUEUED' 
    | 'PROCESSING' 
    | 'COMPLETED' 
    | 'FAILED'
    | 'STORED_NO_INDEX'    // Cloudinary OK, indexing pending
    | 'INDEXED_NO_STORAGE' // Chunks OK, Cloudinary upload failed
    | 'PARTIAL';           // Both present but inconsistent
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
    
    // Phase 131: Storage & Indexing Flags
    hasStorage?: boolean;      // Cloudinary upload successful
    hasChunks?: boolean;        // Chunks created successfully
    storageError?: string;      // Error from Cloudinary upload
    indexingError?: string;      // Error from indexing
    blobId?: string;             // GridFS blob ID for internal processing
    
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
