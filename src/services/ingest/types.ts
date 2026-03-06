import { TenantSession } from '@/lib/db-tenant';

export interface IngestOptions {
    file?: File | { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> };
    metadata: {
        type: string;
        version: string;
        documentTypeId?: string;
        scope?: 'GLOBAL' | 'INDUSTRY' | 'TENANT' | 'USER';
        industry?: string;
        spaceId?: string;
        usage?: 'REFERENCE' | 'TRANSACTIONAL';
        skipIndexing?: boolean;
        chunkingLevel?: 'bajo' | 'medio' | 'alto' | 'SIMPLE' | 'SEMANTIC' | 'LLM';
        force?: boolean | string;
        [key: string]: any; // Allow for dynamic metadata
    };
    tenantId: string;
    userEmail: string;
    environment?: string;
    ip?: string;
    userAgent?: string;
    correlationId?: string;
    maskPii?: boolean;
    enableVision?: boolean;
    enableTranslation?: boolean;
    enableGraphRag?: boolean;
    enableCognitive?: boolean;
    session?: TenantSession;
    chunkSize?: number;
    chunkOverlap?: number;
    chunkThreshold?: number;
    isEnrichment?: boolean;
}

export interface IngestResult {
    success: boolean;
    docId?: string;
    correlationId: string;
    message?: string;
    chunks?: number;
    status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'DUPLICATE';
    isDuplicate?: boolean;
    isCloned?: boolean;
    savings?: number;
    language?: string;
}

export interface EnrichmentOptions {
    correlationId: string;
    userEmail?: string;
    job?: { updateProgress: (percent: number) => Promise<void> };
    enableVision?: boolean;
    enableTranslation?: boolean;
    enableGraphRag?: boolean;
    enableCognitive?: boolean;
    industry?: string;
    type?: string;
    version?: string;
    documentTypeId?: string;
    tenantId?: string;
    isEnrichment?: boolean;
}
export interface IngestPrepareResult {
    docId: string;
    status: 'PENDING' | 'DUPLICATE' | 'FAILED';
    correlationId: string;
    isDuplicate?: boolean;
    savings?: number;
    error?: string;
}
