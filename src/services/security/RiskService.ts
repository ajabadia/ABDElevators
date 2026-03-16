import { RiskFindingSchema, IndustryType } from '@/lib/schemas';
import { PromptRunner } from '@/lib/llm-core/PromptRunner';
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
                    // Rule #12: Prompt Governance - Use PromptRunner.runJson
                    const validatedFindings = await PromptRunner.runJson({
                        key: 'risk_assessment',
                        variables: { industry, caseContent, ragContext },
                        schema: z.array(RiskFindingSchema),
                        tenantId,
                        correlationId: effectiveCorrelationId,
                        industry, // Rule #11/16: Steering by industry
                        task: 'RISK_ANALYSIS'
                    });

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
