import { z } from 'zod';
import { PromptService } from '@/lib/prompt-service';
import { callGeminiPro } from '@/lib/llm';
import { logEvento } from '@/lib/logger';
import { CausalImpactAnalysisSchema, CausalImpactAnalysis } from '@/lib/schemas/intelligence';
import { AppError, ValidationError, ExternalServiceError } from '@/lib/errors';
// Native UUID support from Node.js/Web Crypto API

/**
 * Servicio de Inteligencia Causal (Fase 86)
 * Orquesta el análisis de consecuencias en cascada para hallazgos técnicos.
 */
export class CausalImpactService {
    /**
     * Realiza un análisis de impacto causal para un hallazgo específico.
     * 
     * @param finding - El hallazgo técnico detectado por el RAG.
     * @param context - Contexto técnico adicional (manuales, specs).
     * @param tenantId - ID del cliente para gobernanza de prompts.
     * @returns Promise<CausalImpactAnalysis>
     */
    static async assessImpact(
        finding: string,
        context: string,
        tenantId: string
    ): Promise<CausalImpactAnalysis> {
        const correlationId = crypto.randomUUID();
        const start = Date.now();

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
            // 1. Obtener y renderizar el prompt (Prompt Governance)
            const { text: prompt, model } = await PromptService.getRenderedPrompt(
                'CAUSAL_IMPACT_ANALYSIS',
                { finding, context },
                tenantId,
                'PRODUCTION',
                'REAL_ESTATE' // Defaulting to Real Estate for this phase
            );

            // 2. Ejecutar razonamiento con LLM
            const effectiveModel = model || 'gemini-2.5-flash';
            const response = await callGeminiPro(prompt, tenantId, {
                correlationId,
                model: effectiveModel
            });

            console.log(`🤖 LLM Response Length: ${response.length} characters`);
            console.log(`🤖 Model used: ${effectiveModel}`);

            // Capturar para debug en caso de fallo de parseo
            (global as any).__lastCausalResponse = response;
            let rawData: any;
            try {
                // Extracción robusta de JSON
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("No JSON found in response");

                const cleanJson = jsonMatch[0].trim();
                rawData = JSON.parse(cleanJson);
            } catch (e: any) {
                console.error("❌ [CAUSAL_AI] JSON Extraction Failed!");
                console.error("📦 Raw LLM Response Preview:", response.substring(0, 500) + "...");
                throw new AppError(
                    'EXTERNAL_SERVICE_ERROR',
                    503,
                    `Falló el parseo de la respuesta del motor causal: ${e.message}`
                );
            }

            const validatedData = CausalImpactAnalysisSchema.parse(rawData);

            // 4. Medir performance y loguear éxito
            const duration = Date.now() - start;
            await logEvento({
                level: 'INFO',
                source: 'CAUSAL_AI',
                action: 'ASSESS_IMPACT_SUCCESS',
                message: `Análisis causal completado en ${duration}ms`,
                correlationId,
                tenantId,
                details: {
                    chainLength: validatedData.chain.length,
                    urgency: validatedData.mitigation.urgency,
                    duration_ms: duration
                }
            });

            if (duration > 5000) {
                await logEvento({
                    level: 'WARN',
                    source: 'CAUSAL_AI',
                    action: 'PERFORMANCE_SLA_EXCEEDED',
                    message: 'El análisis causal superó el umbral de 5000ms',
                    correlationId,
                    details: { duration_ms: duration }
                });
            }

            return validatedData;

        } catch (error: unknown) {
            const duration = Date.now() - start;

            if (error instanceof z.ZodError) {
                console.error("❌ [CAUSAL_AI] Zod Validation Failed!");
                console.error("📦 Raw Data received:", JSON.stringify((global as any).__lastCausalResponse, null, 2));
                console.error("❌ Zod Error Details:", JSON.stringify(error.issues, null, 2));
                throw new ValidationError('Estructura de análisis causal inválida', error.issues);
            }

            if (error instanceof AppError) {
                throw error;
            }

            await logEvento({
                level: 'ERROR',
                source: 'CAUSAL_AI',
                action: 'ASSESS_IMPACT_REJECTED',
                message: 'Error crítico en el motor de simulación causal',
                correlationId,
                tenantId,
                details: {
                    error: error instanceof Error ? error.message : String(error),
                    duration_ms: duration,
                    rawResponsePreview: (global as any).__lastCausalResponse?.substring(0, 500)
                }
            });

            throw new AppError(
                'INTERNAL_ERROR',
                500,
                'No se pudo completar la simulación de impacto causal'
            );
        }
    }
}
