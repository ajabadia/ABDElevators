
import { z } from 'zod';

import { IndustryTypeSchema, AppEnvironmentEnum, EntityIdSchema, TenantIdSchema } from '@abd/platform-core';
// Re-export core schemas to ensure monorepo consistency
export { IndustryTypeSchema, AppEnvironmentEnum };

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
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema.optional(), // 'global' if shared
    industry: IndustryTypeSchema.default('ELEVATORS'),
    componentType: z.string(),
    model: z.string(),
    sourceDoc: z.string(),
    assetId: EntityIdSchema, // MANDATORY ERA 12
    documentTypeId: EntityIdSchema, // MANDATORY ERA 12
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
    embedding: z.array(z.number()).optional(),
    embedding_multilingual: z.array(z.number()).optional(),

    isShadow: z.boolean().default(false).optional(),
    originalLang: z.string().optional(),
    refChunkId: EntityIdSchema.optional(),
    cloudinaryUrl: z.string().optional().nullable(),
    originalSnippet: z.string().optional(),

    createdAt: z.date().default(() => new Date()),
    deletedAt: z.date().optional(),
    status: z.enum(['vigente', 'obsoleto', 'borrador']).optional(),
    environment: AppEnvironmentEnum.default('PRODUCTION'),

    realEstateMetadata: RealEstateMetadataSchema.optional(),
    spacePath: z.string().optional(), // Denormalized hierarchy path for $O(1)$ prefix search
});

export const TaxonomyValueSchema = z.object({
    id: z.string(),
    label: z.string(),
    color: z.string().optional(),
});

export const TaxonomySchema = z.object({
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema,
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
export type Taxonomy = z.infer<typeof TaxonomySchema>;
export type TaxonomyValue = z.infer<typeof TaxonomyValueSchema>;

export const RagAuditSchema = z.object({
    _id: EntityIdSchema.optional(),
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
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema,
    performedBy: EntityIdSchema,
    ip: z.string().optional(),
    userAgent: z.string().optional(),

    filename: z.string(),
    sizeBytes: z.number(),
    md5: z.string(),
    docId: EntityIdSchema.optional(),

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
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema,
    correlationId: z.string().uuid(),
    query: z.string(),
    generation: z.string(),
    context_chunks: z.array(EntityIdSchema),

    // Phase 351: Relational Link (Isla 2)
    goldenSetId: EntityIdSchema.optional(),

    // Phase 310: Context & Metadata Tracking
    flowType: z.string().optional(), // e.g. 'TECHNICAL_CHAT'
    agentKey: z.string().optional(), // Identifier for specific Agent config
    engineVersion: z.string().default('v1'), // 'v1' or 'v2'

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

/**
 * 🎯 Golden Set Schema
 * Phase 310: Standardized test sets for RAG benchmarks.
 */
export const RagGoldenSetSchema = z.object({
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema,
    flowType: z.string(),
    query: z.string(),
    groundTruthContextIds: z.array(EntityIdSchema),
    groundTruthAnswer: z.string().optional(),
    criticality: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    tags: z.array(z.string()).default([]),
    notes: z.string().optional(),
    createdBy: EntityIdSchema.optional(),
    createdAt: z.date().default(() => new Date()),
});

/**
 * 🧪 Offline Experiment Schema
 */
export const RagOfflineExperimentSchema = z.object({
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema,
    name: z.string(),
    description: z.string().optional(),
    status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']).default('PENDING'),
    variants: z.array(z.object({
        id: z.string(),
        engineVersion: z.string(),
        config: z.record(z.string(), z.any()).optional()
    })),
    createdAt: z.date().default(() => new Date()),
    completedAt: z.date().optional(),
});

/**
 * 📊 Offline Experiment Result
 */
export const RagOfflineExperimentResultSchema = z.object({
    _id: EntityIdSchema.optional(),
    experimentId: EntityIdSchema,
    queryId: EntityIdSchema, // Reference to Golden Set doc
    variantId: z.string(),
    metrics: z.object({
        faithfulness: z.number(),
        answer_relevance: z.number(),
        context_precision: z.number(),
        context_recall: z.number().optional()
    }),
    durationMs: z.number(),
    timestamp: z.date().default(() => new Date()),
});

export const DocumentTypeSchema = z.object({
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema,
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
    'PARTIAL',
    'STUCK',
    'DEAD'
]);
export type IngestionStatus = z.infer<typeof IngestionStatusEnum>;

export const KnowledgeAssetSchema = z.object({
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema,
    industry: IndustryTypeSchema.default('ELEVATORS'),
    usage: z.enum(['REFERENCE', 'TRANSACTIONAL']).default('REFERENCE'),
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

    cloudinaryUrl: z.string().optional().nullable(),
    cloudinaryPublicId: z.string().optional(),
    fileMd5: z.string().optional(),
    sizeBytes: z.number().default(0),
    totalChunks: z.number().default(0),
    documentTypeId: EntityIdSchema, // MANDATORY ERA 12
    relatedAssets: z.array(z.object({
        targetId: EntityIdSchema,
        type: z.enum(['SUPERSEDES', 'COMPLEMENTS', 'DEPENDS_ON', 'AMENDS', 'RELATED_TO']),
        description: z.string().optional()
    })).default([]),
    contextHeader: z.any().optional(),
    spaceId: EntityIdSchema, // MANDATORY ERA 12
    correlationId: z.string().optional(),
    environment: AppEnvironmentEnum.optional(),
    skipIndexing: z.boolean().default(false).optional(), // Phase 204: Skip vector indexing for transactional docs
    enablePremiumEmbedding: z.boolean().default(false).optional(), // Phase 205: Control Gemini embedding for deterministic flows
    enableHierarchicalRag: z.boolean().default(false).optional(), // Phase 305: Enable tiered indexing

    // Phase 199: Cost Persistence & Metrics
    ingestionCost: z.object({
        totalTokens: z.number().default(0),
        totalUSD: z.number().default(0),
        breakdown: z.array(z.object({
            operation: z.string(),
            model: z.string(),
            tokens: z.number(),
            costUsd: z.number()
        })).default([])
    }).optional(),
    executionMetrics: z.object({
        durationMs: z.number().default(0),
        steps: z.record(z.string(), z.number()).optional(),
        lastStep: z.string().optional()
    }).optional(),

    nextReviewDate: z.date().optional().nullable(),
    lastReviewedAt: z.date().optional().nullable(),
    reviewStatus: z.enum(['pending', 'reviewed', 'expired', 'snoozed']).default('pending'),
    reviewNotes: z.string().optional(),

    realEstateMetadata: RealEstateMetadataSchema.optional(),

    /** @phase 250: Auto-Repair Tracking */
    repairPhase: z.enum(['INDEX_RETRY', 'STORAGE_RETRY', 'NONE']).default('NONE'),
    repairErrorCode: z.string().optional(),
    autoRepaired: z.boolean().default(false),
    spacePath: z.string().optional(), // Denormalized hierarchy path (materializedPath)
});
export type KnowledgeAsset = z.infer<typeof KnowledgeAssetSchema>;

export const FileBlobSchema = z.object({
    _id: EntityIdSchema,
    cloudinaryUrl: z.string(),
    cloudinaryPublicId: z.string(),
    mimeType: z.string().optional(),
    sizeBytes: z.number(),
    refCount: z.number().default(1),
    tenantId: TenantIdSchema.default('abd_global' as any),
    firstSeenAt: z.date().default(() => new Date()),
    lastSeenAt: z.date().default(() => new Date()),
    storageProvider: z.enum(['cloudinary', 's3']).default('cloudinary'),
    metadata: z.record(z.string(), z.any()).optional(),
});
export type FileBlob = z.infer<typeof FileBlobSchema>;


// Inferred Types for Export
export type DocumentChunk = z.infer<typeof DocumentChunkSchema>;
export type RagAudit = z.infer<typeof RagAuditSchema>;
export type IngestAudit = z.infer<typeof IngestAuditSchema>;
export type RagEvaluation = z.infer<typeof RagEvaluationSchema>;
export type RagGoldenSet = z.infer<typeof RagGoldenSetSchema>;
export type RagOfflineExperiment = z.infer<typeof RagOfflineExperimentSchema>;
export type RagOfflineExperimentResult = z.infer<typeof RagOfflineExperimentResultSchema>;

/**
 * 🌳 Hierarchical RAG Schemas (Era 11)
 */

export const DocumentProfileSchema = z.object({
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema,
    assetId: EntityIdSchema,
    spaceId: EntityIdSchema.optional(),
    collectionId: EntityIdSchema.optional(),

    summaryGlobal: z.string(),
    summaryGlobalLang: z.string().default('es'),
    semanticProfileEmbedding: z.array(z.number()).optional(),

    sectionsCount: z.number().default(0),
    ingestionProfileVersion: z.string().default('1.0.0'),

    metadata: z.record(z.string(), z.any()).optional(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

export const DocumentSectionSchema = z.object({
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema,
    assetId: EntityIdSchema,
    spaceId: EntityIdSchema.optional(),
    collectionId: EntityIdSchema.optional(),

    title: z.string(),
    level: z.number().default(1), // 1: Chapter, 2: Sub-chapter, etc.
    summary: z.string(),
    sectionEmbedding: z.array(z.number()).optional(),

    chunkIds: z.array(EntityIdSchema).default([]),
    order: z.number(),

    path: z.string().optional(), // Breadcrumb like Path
    metadata: z.record(z.string(), z.any()).optional(),
    createdAt: z.date().default(() => new Date()),
});

export type DocumentProfile = z.infer<typeof DocumentProfileSchema>;
export type DocumentSection = z.infer<typeof DocumentSectionSchema>;
