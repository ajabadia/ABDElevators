import { callGeminiMini } from './llm';
import { RiskFindingSchema, IndustryType } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { PromptService } from './prompt-service';
import { z } from 'zod';

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
        correlationId: string
    ) {
        const start = Date.now();

        try {
            // Render dynamic prompt using PromptService
            const { text: prompt } = await PromptService.getRenderedPrompt(
                'risk_assessment',
                { industry, caseContent, ragContext },
                tenantId
            );
            const response = await callGeminiMini(prompt, tenantId, { correlationId, temperature: 0 });

            // Extract JSON
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) return [];

            const findings = JSON.parse(jsonMatch[0]);

            // Validate findings with Zod
            const validatedFindings = z.array(RiskFindingSchema).parse(findings);

            await logEvento({
                level: 'INFO',
                source: 'RISK_SERVICE',
                action: 'ANALYZE_SUCCESS',
                message: `Risk analysis completed for ${industry}. Findings: ${validatedFindings.length}`,
                correlationId,
                details: { durationMs: Date.now() - start, findingsCount: validatedFindings.length }
            });

            return validatedFindings;

        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'RISK_SERVICE',
                action: 'ANALYZE_ERROR',
                message: `Error analyzing risks: ${error.message}`,
                correlationId,
                stack: error.stack
            });
            return []; // Safe fallback
        }
    }
}
