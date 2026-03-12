import { z } from 'zod';
import { PromptRunner } from '@/lib/llm-core/PromptRunner';
import { logEvento } from '@/lib/logger';
import { CausalImpactAnalysisSchema, CausalImpactAnalysis } from '@/lib/schemas/intelligence';
import { AppError } from '@/lib/errors';

/**
 * 🛰️ Causal Impact Service (Phase 135)
 * Predicts the consequences of a technical finding using agentic reasoning.
 */
export class CausalImpactService {
    /**
     * Analyzes the systemic impact of a finding.
     */
    static async analyzeImpact(
        finding: string,
        context: string,
        tenantId: string,
        correlationId: string
    ): Promise<CausalImpactAnalysis> {
        const source = 'CAUSAL_IMPACT_SERVICE';
        const action = 'ANALYZE_IMPACT';

        await logEvento({
            level: 'INFO',
            source,
            action,
            message: `Starting causal impact analysis for finding`,
            tenantId,
            correlationId
        });

        try {
            // Unified execution via PromptRunner
            const validatedData = await PromptRunner.runJson({
                key: 'CAUSAL_IMPACT_ANALYSIS',
                variables: { finding, context },
                schema: CausalImpactAnalysisSchema,
                tenantId,
                correlationId,
                temperature: 0.2 // Technical rigor
            });

            await logEvento({
                level: 'INFO',
                source,
                action: 'ANALYZE_IMPACT_SUCCESS',
                message: `Causal analysis completed`,
                correlationId,
                tenantId
            });

            return validatedData;

        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source,
                action: 'CAUSAL_ERROR',
                message: `Causal analysis failed: ${error.message}`,
                tenantId,
                correlationId,
                stack: error.stack
            });
            throw error;
        }
    }
}
