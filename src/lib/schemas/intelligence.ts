import { z } from 'zod';
import { EntityIdSchema, TenantIdSchema, TenantScopedSchema } from './common';

/**
 * Esquema para un nivel de la cadena causal (Phase 86)
 */
export const CausalEffectSchema = z.object({
    level: z.number().int().min(1),
    effect: z.string().min(1),
    risk: z.enum(['Bajo', 'Medio', 'Alto', 'Crítico']),
    description: z.string().min(1)
});

/**
 * Esquema para la mitigación recomendada
 */
export const MitigationStrategySchema = z.object({
    action: z.string().min(1),
    urgency: z.enum(['IMMEDIATE', 'SCHEDULED', 'ROUTINE']),
    estimated_cost_impact: z.enum(['Bajo', 'Medio', 'Alto'])
});

/**
 * Esquema completo del Análisis de Impacto Causal
 */
export const CausalImpactAnalysisSchema = z.object({
    finding_id: EntityIdSchema.optional(),
    chain: z.array(CausalEffectSchema).min(3),
    mitigation: MitigationStrategySchema
});

export type CausalEffect = z.infer<typeof CausalEffectSchema>;
export type MitigationStrategy = z.infer<typeof MitigationStrategySchema>;
export type CausalImpactAnalysis = z.infer<typeof CausalImpactAnalysisSchema>;

//  FASE 190: Knowledge Graph Schemas
export const GraphNodeSchema = z.object({
    id: EntityIdSchema,
    label: z.string(),
    name: z.string(),
    type: z.string(),
    properties: z.record(z.string(), z.any()).default({}),
    tenantId: TenantIdSchema,
    industry: z.string().optional(),
});

export const GraphRelationSchema = z.object({
    id: EntityIdSchema,
    sourceId: EntityIdSchema,
    targetId: EntityIdSchema,
    type: z.string(),
    properties: z.record(z.string(), z.any()).default({}),
    tenantId: TenantIdSchema,
});

export const CreateGraphNodeSchema = GraphNodeSchema.extend({ id: EntityIdSchema.optional() });
export const UpdateGraphNodeSchema = GraphNodeSchema.pick({ id: true }).merge(GraphNodeSchema.partial().omit({ id: true }));
export const CreateGraphRelationSchema = GraphRelationSchema.extend({ id: EntityIdSchema.optional() });
export const UpdateGraphRelationSchema = z.object({
    sourceId: EntityIdSchema,
    targetId: EntityIdSchema,
    type: z.string(),
    properties: z.record(z.string(), z.any()).optional()
});
export const DeleteGraphRelationSchema = z.object({
    sourceId: EntityIdSchema,
    targetId: EntityIdSchema,
    type: z.string()
});

export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphRelation = z.infer<typeof GraphRelationSchema>;
export type CreateGraphNode = z.infer<typeof CreateGraphNodeSchema>;
export type UpdateGraphNode = z.infer<typeof UpdateGraphNodeSchema>;
export type CreateGraphRelation = z.infer<typeof CreateGraphRelationSchema>;
export type UpdateGraphRelation = z.infer<typeof UpdateGraphRelationSchema>;
export type DeleteGraphRelation = z.infer<typeof DeleteGraphRelationSchema>;

/**
 * 🌉 ASSET CHUNK BRIDGE (ERA 12)
 * Bridge between MongoDB Knowledge Assets and Vector DB Chunks.
 */
export const AssetChunkSchema = TenantScopedSchema.extend({
    _id: EntityIdSchema.optional(),
    assetId: EntityIdSchema, // Reference to KnowledgeAsset
    spaceId: EntityIdSchema, // Space ownership

    // Vector Sync Metadata
    vectorProvider: z.enum(['PINECONE', 'WEAVIATE', 'CHROMA']).default('PINECONE'),
    vectorId: z.string(), // ID in the vector database

    // Content Metadata
    content: z.string(),
    tokensCount: z.number(),

    // Cognitive Hierarchy (Era 11+)
    docProfileId: EntityIdSchema.optional(),
    docSectionId: EntityIdSchema.optional(),

    // Performance Metrics
    hitCount: z.number().default(0),
    lastHitAt: z.date().optional(),
});

export type AssetChunk = z.infer<typeof AssetChunkSchema>;
