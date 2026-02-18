
import { z } from 'zod';

// Temporary imports from root until core schemas are moved
import { IndustryTypeSchema, AppEnvironmentEnum } from '@/lib/schemas/core';

/**
 * 📚 RAG & Knowledge Management Schemas
 */

export const RealEstateMetadataSchema = z.object({
    buildingId: z.string().optional(),
    block: z.string().optional(),
    floor: z.string().optional(),
    unit: z.string().optional(),
    cadastralReference: z.string().optional(),
    propertyType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'LAND', 'OTHER']).optional(),
}).passthrough();

export type RealEstateMetadata = z.infer<typeof RealEstateMetadataSchema>;

export const DocumentChunkSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string().optional(), // 'global' if shared
    industry: IndustryTypeSchema.default('ELEVATORS'),
    componentType: z.string(),
    model: z.string(),
    sourceDoc: z.string(),
    documentTypeId: z.string().optional(),
    version: z.string(),
    revisionDate: z.date(),
    approxPage: z.number().optional(),
    chunkType: z.enum(['TEXT', 'VISUAL']).default('TEXT'),
    chunkText: z.string(),
    translatedText: z.string().optional(),
    visualDescription: z.string().optional(),
    textBefore: z.string().optional(),
    textAfter: z.string().optional(),
    language: z.string().default('es'),
    embedding: z.array(z.number()),
    embedding_multilingual: z.array(z.number()).optional(),

    isShadow: z.boolean().default(false).optional(),
    originalLang: z.string().optional(),
    refChunkId: z.any().optional(),
    cloudinaryUrl: z.string().optional(),
    originalSnippet: z.string().optional(),

    createdAt: z.date().default(() => new Date()),
    deletedAt: z.date().optional(),
    status: z.enum(['vigente', 'obsoleto', 'borrador']).optional(),
    environment: AppEnvironmentEnum.default('PRODUCTION'),

    realEstateMetadata: RealEstateMetadataSchema.optional(),
});

export const TaxonomyValueSchema = z.object({
    id: z.string(),
    label: z.string(),
    color: z.string().optional(),
});

export const TaxonomySchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    industry: IndustryTypeSchema,
    name: z.string(),
    key: z.string(),
    description: z.string().optional(),
    options: z.array(TaxonomyValueSchema),
    multiple: z.boolean().default(false),
    required: z.boolean().default(false),
    active: z.boolean().default(true),
    createdAt: z.date().default(() => new Date()),
});

export const RagAuditSchema = z.object({
    _id: z.any().optional(),
    correlationId: z.string().uuid(),
    industry: IndustryTypeSchema.default('GENERIC'),
    phase: z.string(),
    input: z.any(),
    output: z.any(),
    durationMs: z.number(),
    token_usage: z.object({
        prompt: z.number(),
        completion: z.number(),
    }).optional(),
    timestamp: z.date().default(() => new Date()),
});

export const IngestAuditSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    performedBy: z.string(),
    ip: z.string().optional(),
    userAgent: z.string().optional(),

    filename: z.string(),
    fileSize: z.number(),
    md5: z.string(),
    docId: z.any().optional(),

    correlationId: z.string(),
    status: z.enum(['SUCCESS', 'FAILED', 'DUPLICATE', 'PENDING', 'PROCESSING', 'RESTORED']),
    details: z.object({
        chunks: z.number().default(0),
        duration_ms: z.number(),
        savings_tokens: z.number().optional(),
        error: z.string().optional(),
        source: z.string().optional(),
        scope: z.string().optional(),
        deduplicated: z.boolean().optional()
    }).passthrough().optional(),

    timestamp: z.date().default(() => new Date()),
});

export const RagEvaluationSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    correlationId: z.string().uuid(),
    query: z.string(),
    generation: z.string(),
    context_chunks: z.array(z.string()),

    metrics: z.object({
        faithfulness: z.number().min(0).max(1),
        answer_relevance: z.number().min(0).max(1),
        context_precision: z.number().min(0).max(1),
        context_recall: z.number().min(0).max(1).optional(),
    }),

    judge_model: z.string(),
    trace: z.array(z.string()).optional(),
    feedback: z.string().optional(),

    causal_analysis: z.object({
        cause_id: z.string(),
        fix_strategy: z.string(),
    }).optional(),
    self_corrected: z.boolean().default(false),
    original_evaluation: z.any().optional(),

    timestamp: z.date().default(() => new Date()),
});

export const DocumentTypeSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    name: z.string().min(1),
    description: z.string().optional(),
    scope: z.enum(['GLOBAL', 'INDUSTRY', 'TENANT']).default('TENANT'),
    industry: IndustryTypeSchema.optional(),
    industries: z.array(IndustryTypeSchema).default([]),
    category: z.string().optional(),
    isActive: z.boolean().default(true),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const IngestionStatusEnum = z.enum([
    'PENDING',
    'QUEUED',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'STORED_NO_INDEX',
    'INDEXED_NO_STORAGE',
    'PARTIAL'
]);
export type IngestionStatus = z.infer<typeof IngestionStatusEnum>;

export const KnowledgeAssetSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    industry: IndustryTypeSchema.default('ELEVATORS'),
    filename: z.string(),
    componentType: z.string(),
    model: z.string(),
    version: z.string(),
    revisionDate: z.date(),
    language: z.string().default('es'),
    status: z.enum(['vigente', 'obsoleto', 'borrador']).default('vigente'),
    ingestionStatus: IngestionStatusEnum.default('PENDING'),
    progress: z.number().min(0).max(100).default(0),
    attempts: z.number().default(0),
    error: z.string().optional(),

    hasStorage: z.boolean().default(false),
    hasChunks: z.boolean().default(false),
    storageError: z.string().optional(),
    indexingError: z.string().optional(),
    blobId: z.string().optional(),

    chunkingLevel: z.enum(['bajo', 'medio', 'alto']).default('bajo'),

    cloudinaryUrl: z.string().optional(),
    cloudinaryPublicId: z.string().optional(),
    fileMd5: z.string().optional(),
    sizeBytes: z.number().default(0),
    totalChunks: z.number().default(0),
    documentTypeId: z.string().optional(),
    relatedAssets: z.array(z.object({
        targetId: z.string(),
        type: z.enum(['SUPERSEDES', 'COMPLEMENTS', 'DEPENDS_ON', 'AMENDS', 'RELATED_TO']),
        description: z.string().optional()
    })).default([]),
    contextHeader: z.any().optional(),
    spaceId: z.string().optional(),
    correlationId: z.string().optional(),
    environment: AppEnvironmentEnum.optional(),

    nextReviewDate: z.date().optional().nullable(),
    lastReviewedAt: z.date().optional().nullable(),
    reviewStatus: z.enum(['pending', 'reviewed', 'expired', 'snoozed']).default('pending'),
    reviewNotes: z.string().optional(),

    realEstateMetadata: RealEstateMetadataSchema.optional(),
});
export type KnowledgeAsset = z.infer<typeof KnowledgeAssetSchema>;

export const FileBlobSchema = z.object({
    _id: z.string(),
    cloudinaryUrl: z.string(),
    cloudinaryPublicId: z.string(),
    mimeType: z.string().optional(),
    sizeBytes: z.number(),
    refCount: z.number().default(1),
    tenantId: z.string().default('abd_global'),
    firstSeenAt: z.date().default(() => new Date()),
    lastSeenAt: z.date().default(() => new Date()),
    storageProvider: z.enum(['cloudinary', 's3']).default('cloudinary'),
    metadata: z.record(z.string(), z.any()).optional(),
});
export type FileBlob = z.infer<typeof FileBlobSchema>;
