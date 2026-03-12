import { z } from "zod";
import { EntityIdSchema, TenantScopedSchema, VersionedEntitySchema } from "./common";

/**
 * 📦 KNOWLEDGE ASSET SCHEMA (v2.0)
 * Phase 355: Structural Hardening & Island Resolution.
 */
export const KnowledgeAssetSchema = z.object({
    // Relaciones obligatorias (cerrar islas)
    spaceId: EntityIdSchema,           // Relacional: Forzar pertenencia a espacio
    documentTypeId: EntityIdSchema,    // Relacional: Forzar categorización

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
        downloadUrl: z.string().url().optional()
    }),

    // Lifecycle & Governance
    status: z.enum(['vigente', 'obsoleto', 'borrador']).default('vigente'),
    ingestionStatus: z.enum([
        "PENDING",
        "EXTRACTING",
        "CHUNKING",
        "EMBEDDING",
        "INDEXING",
        "COMPLETED",
        "FAILED",
        "QUARANTINED"
    ]).default("PENDING"),

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

    // Legacy mapping support (optional)
    legacyDocumentType: z.string().optional(),
    spacePath: z.string().optional(),
})
    .merge(TenantScopedSchema)
    .merge(VersionedEntitySchema);

export type KnowledgeAsset = z.infer<typeof KnowledgeAssetSchema>;
