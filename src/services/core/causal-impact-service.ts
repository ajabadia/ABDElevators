import { z } from 'zod';
import { PromptRunner } from '@/lib/llm-core/PromptRunner';
import { logEvento } from '@/lib/logger';
import { CausalImpactAnalysisSchema, CausalImpactAnalysis } from '@/lib/schemas/intelligence';
import { AppError } from '@/lib/errors';

/**
 * Servicio de Inteligencia Causal (Fase 86) - Migrado a LLM Core Core (Era 7).
 * Orquesta el análisis de consecuencias en cascada para hallazgos técnicos.
 */
export class CausalImpactService {
    /**
     * Realiza un análisis de impacto causal para un hallazgo específico.
     */
    static async assessImpact(
        finding: string,
        context: string,
        tenantId: string
    ): Promise<CausalImpactAnalysis> {
        const correlationId = crypto.randomUUID();

        await logEvento({
            level: 'INFO',
            source: 'CAUSAL_AI',
            action: 'ASSESS_IMPACT_START',
            message: 'Iniciando simulación de impacto causal',
            correlationId,
            tenantId,
            details: { finding: finding.substring(0, 100) + '...' }
        });

        try {
            // Ejecución unificada via PromptRunner
            const validatedData = await PromptRunner.runJson({
                key: 'CAUSAL_IMPACT_ANALYSIS',
                variables: { finding, context },
                schema: CausalImpactAnalysisSchema,
                tenantId,
                correlationId,
                temperature: 0.2 // Rigor técnico
            });

            await logEvento({
                level: 'INFO',
                source: 'CAUSAL_AI',
                action: 'ASSESS_IMPACT_SUCCESS',
                message: `Análisis causal completado`,
                correlationId,
                tenantId,
                details: {
                    chainLength: validatedData.chain.length,
                    urgency: validatedData.mitigation.urgency
                }
            });

            return validatedData;

        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'CAUSAL_AI',
                action: 'ASSESS_IMPACT_FAILURE',
                message: `Fallo en el motor de simulación causal: ${error.message}`,
                correlationId,
                tenantId
            });

            if (error instanceof AppError) throw error;

            throw new AppError(
                'INTERNAL_ERROR',
                500,
                'No se pudo completar la simulación de impacto causal'
            );
        }
    }
}
