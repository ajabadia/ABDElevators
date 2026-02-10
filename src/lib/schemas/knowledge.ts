import { z } from 'zod';
import { IndustryTypeSchema, AppEnvironmentEnum } from './core';

/**
 * 📚 RAG & Knowledge Management Schemas
 */

export const DocumentChunkSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string().optional(), // 'global' if shared
    industry: IndustryTypeSchema.default('ELEVATORS'),
    componentType: z.string(),
    model: z.string(),
    sourceDoc: z.string(),
    documentTypeId: z.string().optional(), // Referencia al maestro de tipos
    version: z.string(),
    revisionDate: z.date(),
    approxPage: z.number().optional(),
    chunkType: z.enum(['TEXT', 'VISUAL']).default('TEXT'),
    chunkText: z.string(),
    translatedText: z.string().optional(), // Traducción técnica al Castellano (Phase 21.1)
    visualDescription: z.string().optional(), // Descripción técnica para visual chunks
    textBefore: z.string().optional(),
    textAfter: z.string().optional(),
    language: z.string().default('es'), // Idioma detectado del documento
    embedding: z.array(z.number()), // Gemini 004
    embedding_multilingual: z.array(z.number()).optional(), // BGE-M3 (Phase 21.1)

    // Metadata para Dual-Indexing (Shadow Chunks)
    isShadow: z.boolean().default(false).optional(),
    originalLang: z.string().optional(),
    refChunkId: z.any().optional(),
    cloudinaryUrl: z.string().optional(),
    originalSnippet: z.string().optional(), // Original chunk text before contextualization

    createdAt: z.date().default(() => new Date()),
    deletedAt: z.date().optional(),
    status: z.enum(['vigente', 'obsoleto', 'borrador']).optional(),
    environment: AppEnvironmentEnum.default('PRODUCTION'),
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
    name: z.string(),                 // Ej: "Ubicación", "Criticidad"
    key: z.string(),                  // Ej: "location", "criticality"
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
    industry: IndustryTypeSchema.default('GENERIC'),   // Trazabilidad por industria (Phase 105)
    phase: z.string(),                    // 'EXTRACCIÓN_MODELOS', 'VECTOR_SEARCH', 'REPORTE'
    input: z.any(),                      // prompt o query
    output: z.any(),                     // respuesta Gemini o resultados search
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
    performedBy: z.string(), // Email o ID del usuario
    ip: z.string().optional(),
    userAgent: z.string().optional(),

    // Detalles del archivo
    filename: z.string(),
    fileSize: z.number(),
    md5: z.string(),
    docId: z.any().optional(), // ID en documentos_tecnicos

    // Metadata
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

    // Métricas (0-1)
    metrics: z.object({
        faithfulness: z.number().min(0).max(1),       // ¿Está basado en los documentos?
        answer_relevance: z.number().min(0).max(1),   // ¿Responde a la pregunta?
        context_precision: z.number().min(0).max(1),  // ¿Los documentos recuperados son útiles?
        context_recall: z.number().min(0).max(1).optional(), // Solo si hay ground truth
    }),

    judge_model: z.string(),
    trace: z.array(z.string()).optional(),
    feedback: z.string().optional(),

    // Causal AI (Phase 86)
    causal_analysis: z.object({
        cause_id: z.string(),
        fix_strategy: z.string(),
    }).optional(),
    self_corrected: z.boolean().default(false),
    original_evaluation: z.any().optional(), // Evaluation of the first attempt

    timestamp: z.date().default(() => new Date()),
});

export const DocumentTypeSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    name: z.string().min(1),
    description: z.string().optional(),
    scope: z.enum(['GLOBAL', 'INDUSTRY', 'TENANT']).default('TENANT'),
    industry: IndustryTypeSchema.optional(), // Legacy single industry
    industries: z.array(IndustryTypeSchema).default([]), // Multi-industry (Phase 101.1)
    category: z.string().optional(), // Used for grouping
    isActive: z.boolean().default(true),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const KnowledgeAssetSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    industry: IndustryTypeSchema.default('ELEVATORS'),
    filename: z.string(),
    componentType: z.string(),
    model: z.string(),
    version: z.string(),
    revisionDate: z.date(),
    language: z.string().default('es'), // Idioma principal detectado
    status: z.enum(['vigente', 'obsoleto', 'borrador']).default('vigente'),
    ingestionStatus: z.enum(['PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED']).default('PENDING'),
    progress: z.number().min(0).max(100).default(0), // Porcentaje de avance
    attempts: z.number().default(0), // Reintentos realizados
    error: z.string().optional(), // Para registrar errores asíncronos
    cloudinaryUrl: z.string().optional(),
    cloudinaryPublicId: z.string().optional(),
    fileMd5: z.string().optional(), // Para de-duplicación y ahorro de tokens
    sizeBytes: z.number().default(0),
    totalChunks: z.number().default(0),
    documentTypeId: z.string().optional(), // Referencia al maestro de tipos (Fase Categorización)
    relatedAssets: z.array(z.object({
        targetId: z.string(),
        type: z.enum(['SUPERSEDES', 'COMPLEMENTS', 'DEPENDS_ON', 'AMENDS', 'RELATED_TO']),
        description: z.string().optional()
    })).default([]),
    contextHeader: z.any().optional(), // Metadata de contexto del documento
    correlationId: z.string().optional(), // Added for tracing
});
export type KnowledgeAsset = z.infer<typeof KnowledgeAssetSchema>;

export const FileBlobSchema = z.object({
    _id: z.string(), // MD5 Hash
    cloudinaryUrl: z.string(),
    cloudinaryPublicId: z.string(),
    mimeType: z.string().optional(),
    sizeBytes: z.number(),
    refCount: z.number().default(1),
    tenantId: z.string().default('abd_global'), // Required for SecureCollection visibility
    firstSeenAt: z.date().default(() => new Date()),
    lastSeenAt: z.date().default(() => new Date()),
    storageProvider: z.enum(['cloudinary', 's3']).default('cloudinary'),
    metadata: z.record(z.string(), z.any()).optional(),
});
export type FileBlob = z.infer<typeof FileBlobSchema>;
