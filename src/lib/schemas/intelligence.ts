import { z } from 'zod';

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
    finding_id: z.string().optional(),
    chain: z.array(CausalEffectSchema).min(3),
    mitigation: MitigationStrategySchema
});

export type CausalEffect = z.infer<typeof CausalEffectSchema>;
export type MitigationStrategy = z.infer<typeof MitigationStrategySchema>;
export type CausalImpactAnalysis = z.infer<typeof CausalImpactAnalysisSchema>;

//  FASE 190: Knowledge Graph Schemas
export const GraphNodeSchema = z.object({
    id: z.string(),
    label: z.string(),
    type: z.string(),
    properties: z.record(z.string(), z.any()).default({}),
    tenantId: z.string(),
    industry: z.string().optional(),
});

export const GraphRelationSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    type: z.string(),
    properties: z.record(z.string(), z.any()).default({}),
    tenantId: z.string(),
});

export const CreateGraphNodeSchema = GraphNodeSchema.omit({ id: true });
export const UpdateGraphNodeSchema = GraphNodeSchema.partial().omit({ id: true });
export const CreateGraphRelationSchema = GraphRelationSchema.omit({ id: true });
export const DeleteGraphRelationSchema = z.object({ id: z.string() });

export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphRelation = z.infer<typeof GraphRelationSchema>;
export type CreateGraphNode = z.infer<typeof CreateGraphNodeSchema>;
export type UpdateGraphNode = z.infer<typeof UpdateGraphNodeSchema>;
export type CreateGraphRelation = z.infer<typeof CreateGraphRelationSchema>;
export type DeleteGraphRelation = z.infer<typeof DeleteGraphRelationSchema>;
