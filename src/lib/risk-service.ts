import { callGeminiMini } from './llm';
import { RiskFindingSchema, IndustryType } from './schemas';
import { logEvento } from './logger';
import { PromptService } from './prompt-service';
import { z } from 'zod';

/**
 * Servicio de Inteligencia de Riesgos (Visión 2.0 - Fase 7.5)
 */
export class RiskService {
    /**
     * Analiza un caso en busca de riesgos utilizando el contexto del RAG.
     */
    static async analyzeRisks(
        caseContent: string,
        ragContext: string,
        industry: IndustryType,
        tenantId: string,
        correlacion_id: string
    ) {
        const start = Date.now();

        try {
            // Render dynamic prompt using PromptService
            const renderedPrompt = await PromptService.renderPrompt(
                'RISK_AUDITOR',
                { industry, caseContent, ragContext },
                tenantId
            );

            const response = await callGeminiMini(renderedPrompt, tenantId, { correlacion_id, temperature: 0 });

            // Extraer JSON
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) return [];

            const findings = JSON.parse(jsonMatch[0]);

            // Validar hallazgos con Zod
            const validatedFindings = z.array(RiskFindingSchema).parse(findings);

            await logEvento({
                nivel: 'INFO',
                origen: 'RISK_SERVICE',
                accion: 'ANALYZE_SUCCESS',
                mensaje: `Análisis de riesgos completado para ${industry}. Hallazgos: ${validatedFindings.length}`,
                correlacion_id,
                detalles: { duration_ms: Date.now() - start, findings_count: validatedFindings.length }
            });

            return validatedFindings;

        } catch (error: any) {
            await logEvento({
                nivel: 'ERROR',
                origen: 'RISK_SERVICE',
                accion: 'ANALYZE_ERROR',
                mensaje: `Error analizando riesgos: ${error.message}`,
                correlacion_id,
                stack: error.stack
            });
            return []; // Fallback seguro: no bloqueamos el flujo principal
        }
    }
}
