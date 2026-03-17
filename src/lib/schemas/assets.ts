import { z } from "zod";
import { EntityIdSchema, TenantScopedSchema, VersionedEntitySchema } from "./common";
import { IndustryTypeSchema } from "./core";

// Era 12: Deployment Segregation
export const AppEnvironmentSchema = z.enum(['PRODUCTION', 'STAGING', 'DEVELOPMENT', 'LOCAL']);
export type AppEnvironment = z.infer<typeof AppEnvironmentSchema>;

/**
 * 📦 KNOWLEDGE ASSET SCHEMA (v2.0)
 * Phase 355: Structural Hardening & Island Resolution.
 */
export const KnowledgeAssetSchema = z.object({
    // Relaciones obligatorias (cerrar islas)
    spaceId: EntityIdSchema,           // Relacional: Forzar pertenencia a espacio
    documentTypeId: EntityIdSchema,    // Relacional: Forzar categorización
    industry: IndustryTypeSchema.default('ELEVATORS'), 
    environment: AppEnvironmentSchema.default('PRODUCTION'),

    // Ownership
    ownerId: EntityIdSchema,
    collaborators: z.array(z.object({
        userId: EntityIdSchema,
        permission: z.enum(["VIEW", "COMMENT", "EDIT"]),
        addedAt: z.date().default(() => new Date())
    })).default([]),

    // Archivo fuente
    source: z.object({
        filename: z.string(),
        originalName: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number(),
        checksum: z.string(), // SHA-256 for deduplication
        storageProvider: z.enum(["cloudinary", "s3", "gcs", "azure"]).default("cloudinary"),
        storageKey: z.string(),
        downloadUrl: z.string().url().nullish() // Soften to nullish for legacy DB compatibility
    }),

    // Lifecycle & Governance
    status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT']).default('ACTIVE'),
    ingestionStatus: z.enum([
        "PENDING",
        "QUEUED",
        "EXTRACTING",
        "CHUNKING",
        "EMBEDDING",
        "INDEXING",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
        "STORED_NO_INDEX",
        "INDEXED_NO_STORAGE",
        "PARTIAL",
        "STUCK",
        "DEAD",
        "QUARANTINED"
    ]).default("PENDING"),

    attempts: z.number().default(0),

    executionMetrics: z.object({
        durationMs: z.number().optional(),
        lastStep: z.string().optional(),
        startedAt: z.date().optional(),
        completedAt: z.date().optional()
    }).default({}),

    processingPipeline: z.array(z.object({
        stage: z.string(),
        status: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED"]),
        startedAt: z.date().optional(),
        completedAt: z.date().optional(),
        error: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional()
    })).default([]),

    // Contenido extraído / enriquecido
    extractedContent: z.object({
        text: z.string().max(100000).optional(),
        pageCount: z.number().optional(),
        language: z.string().optional(),
        entities: z.array(z.object({
            type: z.enum(["PERSON", "ORG", "LOCATION", "DATE", "TECHNICALTERM"]),
            value: z.string(),
            confidence: z.number()
        })).default([])
    }).optional(),

    // Metadatos según DocumentType (Extensible)
    domainMetadata: z.record(z.string(), z.unknown()).default({}),

    // Uso & Telemetría
    usageStats: z.object({
        viewCount: z.number().default(0),
        downloadCount: z.number().default(0),
        queryCount: z.number().default(0),
        lastAccessedAt: z.date().optional(),
        lastAccessedBy: EntityIdSchema.optional()
    }).default({
        viewCount: 0,
        downloadCount: 0,
        queryCount: 0
    }),

    // Relación con chunks (Isla 2)
    chunkIds: z.array(EntityIdSchema).default([]),
    totalChunks: z.number().default(0),

    // GridFS support
    blobId: z.string().optional(),

    // Phase 81: Scheduled Review Dates & Lifecycle
    reviewStatus: z.enum(['pending', 'reviewed', 'expired', 'snoozed']).default('pending'),
    nextReviewDate: z.date().optional(),
    lastReviewedAt: z.date().optional(),
    reviewNotes: z.string().optional(),
    reviewHistory: z.array(z.object({
        date: z.date(),
        action: z.string(),
        user: z.string(),
        notes: z.string().optional()
    })).default([]),

    // Legacy mapping support (optional)
    legacyDocumentType: z.string().optional(),
    spacePath: z.string().optional(),
    correlationId: z.string().optional(),
    error: z.string().optional().nullable(),
    progress: z.number().optional().default(0),
    componentType: z.string().default('DOCUMENT'),
    scope: z.enum(['USER', 'TENANT', 'INDUSTRY', 'GLOBAL']).default('TENANT'),
    chunkingLevel: z.enum(['SIMPLE', 'SEMANTIC', 'LLM']).default('SIMPLE'),
    usage: z.enum(['REFERENCE', 'TRANSACTIONAL']).default('REFERENCE'),
    skipIndexing: z.boolean().default(false),
    hasStorage: z.boolean().default(false),
    fileMd5: z.string().optional(),
    language: z.string().default('es'),
    cloudinaryUrl: z.string().optional(),
    cloudinaryPublicId: z.string().optional(),
    // Intelligence Flags
    enableVision: z.boolean().default(false),
    enableTranslation: z.boolean().default(false),
    enableGraphRag: z.boolean().default(false),
    enableCognitive: z.boolean().default(false),
    enableHierarchicalRag: z.boolean().default(false),
})
    .merge(TenantScopedSchema)
    .merge(VersionedEntitySchema);

export type KnowledgeAsset = z.infer<typeof KnowledgeAssetSchema>;
