/**
 * ⚡ FASE 182: Knowledge Domain Decoupling
 * Compatibility Bridge: Points to @abd/rag-engine
 * 
 * ⚠️ CRITICAL: Only re-export schemas and types here.
 * Do NOT use `export * from '@abd/rag-engine'` — it pulls server-only
 * modules (rag-service → tracing → async_hooks) into client bundles.
 * Server-only consumers should import directly from '@abd/rag-engine'.
 */
export {
    // Schemas
    RealEstateMetadataSchema,
    DocumentChunkSchema,
    TaxonomyValueSchema,
    TaxonomySchema,
    RagAuditSchema,
    IngestAuditSchema,
    RagEvaluationSchema,
    DocumentTypeSchema,
    IngestionStatusEnum,
    KnowledgeAssetSchema,
    FileBlobSchema,
    // Core re-exports from rag-engine
    IndustryTypeSchema,
    AppEnvironmentEnum,
} from '@abd/rag-engine';

export type {
    // Types
    RealEstateMetadata,
    Taxonomy,
    TaxonomyValue,
    DocumentType,
    IngestionStatus,
    KnowledgeAsset,
    FileBlob,
    DocumentChunk,
    RagAudit,
    IngestAudit,
    RagEvaluation,
    RagResult,
} from '@abd/rag-engine';
