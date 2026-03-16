import { callGeminiMini } from '@/services/llm/llm-service';
import { RiskFindingSchema, IndustryType } from '@/lib/schemas';
import { PromptService } from '@/services/llm/prompt-service';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * Risk Intelligence Service (Vision 2.0 - Phase 7.5)
 */
export class RiskService {
    /**
     * Analyzes a case for risks using RAG context.
     */
    static async analyzeRisks(
        caseContent: string,
        ragContext: string,
        industry: IndustryType,
        tenantId: string,
        correlationId?: string
    ) {
        return await withCorrelation(
            { level: 'INFO', source: 'RISK_SERVICE', action: 'ANALYZE_RISKS', tenantId, correlationId },
            async ({ log, correlationId: effectiveCorrelationId }) => {
                const start = Date.now();

                try {
                    // Render dynamic prompt using PromptService
                    const { text: prompt, model, version } = await PromptService.getRenderedPrompt(
                        'risk_assessment',
                        { industry, caseContent, ragContext },
                        tenantId,
                        'PRODUCTION',
                        industry,
                        undefined,
                        'RISK_ANALYSIS'
                    );
                    const response = await callGeminiMini(prompt, tenantId, { correlationId: effectiveCorrelationId, temperature: 0, model });

                    // Extract JSON
                    const jsonMatch = response.match(/\[[\s\S]*\]/);
                    if (!jsonMatch) return [];

                    const findings = JSON.parse(jsonMatch[0]);

                    // Validate findings with Zod
                    const validatedFindings = z.array(RiskFindingSchema).parse(findings);

                    await log({
                        action: 'ANALYZE_SUCCESS',
                        message: `Risk analysis completed for ${industry}. Findings: ${validatedFindings.length}`,
                        details: { durationMs: Date.now() - start, findingsCount: validatedFindings.length }
                    });

                    return validatedFindings;

                } catch (error: unknown) {
                    const err = error as Error;
                    await log({
                        level: 'ERROR',
                        action: 'ANALYZE_ERROR',
                        message: `Error analyzing risks: ${err.message}`,
                        details: { stack: err.stack }
                    });
                    return []; // Safe fallback
                }
            }
        );
    }
}
