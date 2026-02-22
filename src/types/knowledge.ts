// Phase 131: Extended Ingestion Status for granular retry
export type IngestionStatus =
    | 'PENDING'
    | 'QUEUED'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED'
    | 'STORED_NO_INDEX'    // Cloudinary OK, indexing pending
    | 'INDEXED_NO_STORAGE' // Chunks OK, Cloudinary upload failed
    | 'PARTIAL'
    | 'STUCK'
    | 'DEAD';
// Both present but inconsistent
export type AssetUsage = 'REFERENCE' | 'TRANSACTIONAL';
export type AssetStatus = 'vigente' | 'obsoleto' | 'borrador' | 'archivado' | 'active' | 'obsolete' | 'draft' | 'archived';

export interface KnowledgeAsset {
    _id: string;
    filename: string;
    usage?: AssetUsage; // REFERENCE (RAG) vs TRANSACTIONAL (Extraction only)
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

    // Phase 81: Scheduled Review Dates & Lifecycle
    nextReviewDate?: string | Date;
    lastReviewedAt?: string | Date;
    reviewStatus?: 'pending' | 'reviewed' | 'expired' | 'snoozed';
    reviewNotes?: string;

    // Phase 199: Cost Persistence & Metrics
    ingestionCost?: {
        totalTokens: number;
        totalUSD: number;
        breakdown: Array<{
            operation: string;
            model: string;
            tokens: number;
            costUsd: number;
        }>;
    };
    executionMetrics?: {
        durationMs: number;
        steps?: Record<string, number>;
        lastStep?: string;
    };
}
