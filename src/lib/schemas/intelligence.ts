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
