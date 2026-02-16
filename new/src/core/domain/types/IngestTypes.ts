export interface IngestOptions {
    file: File;
    metadata: {
        type: string;
        version: string;
        documentTypeId?: string;
        scope?: 'GLOBAL' | 'TENANT';
        industry?: string;
    };
    tenantId: string;
    correlationId?: string;
    userEmail?: string;
    environment?: string;
    ip?: string;
    userAgent?: string;
}
