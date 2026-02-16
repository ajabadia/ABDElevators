export interface IngestOptions {
    file: File | { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> };
    metadata: {
        type: string;
        version: string;
        documentTypeId?: string;
        scope?: 'GLOBAL' | 'INDUSTRY' | 'TENANT';
        industry?: string;
    };
    tenantId: string;
    userEmail: string;
    environment?: string;
    ip?: string;
    userAgent?: string;
    correlationId?: string;
    maskPii?: boolean;
}

export interface IngestResult {
    success: boolean;
    correlationId: string;
    message: string;
    chunks: number;
    isDuplicate?: boolean;
    isCloned?: boolean;
    savings?: number;
    language?: string;
}
export interface IngestPrepareResult {
    docId: string;
    status: 'PENDING' | 'DUPLICATE' | 'FAILED';
    correlationId: string;
    isDuplicate?: boolean;
    savings?: number;
    error?: string;
}
