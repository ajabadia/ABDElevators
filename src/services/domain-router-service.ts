import { callGeminiMini } from '@/lib/llm';
import { IndustryType } from '@/lib/schemas';
import { PromptService } from '@/lib/prompt-service';
import { PROMPTS } from '@/lib/prompts';
import { logEvento } from '@/lib/logger';

/**
 * 🛰️ Domain Router Service (Phase 101)
 * Detects the industry/vertical of a document using heuristics and AI.
 */
export class DomainRouterService {
    private static KEYWORDS: Record<IndustryType, string[]> = {
        ELEVATORS: ['ascensor', 'elevador', 'lift', 'hoistway', 'maniobra', 'botonera', 'cabin', 'shaft', 'arca ii', 'elevator', 'escalator', 'mantenimiento'],
        LEGAL: ['contract', 'contrato', 'clause', 'jurisdiction', 'liability', 'indemnity', 'agreement', 'legal', 'tribunal', 'ley', 'law', 'lawsuit'],
        BANKING: ['balance', 'asset', 'liability', 'ledger', 'loan', 'mortgage', 'interest rate', 'compliance', 'swift', 'iban', 'banca', 'bank', 'credit'],
        INSURANCE: ['policy', 'premium', 'coverage', 'claim', 'underwriting', 'deductible', 'beneficiary', 'póliza', 'siniestro', 'cobertura', 'insurance', 'seguro'],
        IT: ['code', 'api', 'server', 'database', 'frontend', 'backend', 'vulnerability', 'deployment', 'cloud', 'software', 'git', 'bug'],
        MEDICAL: ['paciente', 'historial', 'diagnóstico', 'receta', 'tratamiento', 'clínica', 'hospital', 'médico', 'síntoma', 'infection', 'bacterial', 'patient', 'doctor', 'treatment', 'medical'],
        GENERIC: []
    };

    /**
     * Detects the industry of aiven text.
     */
    static async detectIndustry(text: string, tenantId: string, correlationId?: string, session?: any): Promise<IndustryType> {
        const lowerText = text.toLowerCase();

        // 1. Heuristics (Quick & Cheap)
        const scores: Record<string, number> = {};

        for (const [industry, keywords] of Object.entries(this.KEYWORDS)) {
            scores[industry] = keywords.reduce((count, kw) => {
                const regex = new RegExp(`\\b${kw}\\b`, 'g');
                return count + (lowerText.match(regex)?.length || 0);
            }, 0);
        }

        const bestHeuristic = Object.entries(scores).reduce((a, b) => b[1] > a[1] ? b : a);

        if (bestHeuristic[1] >= 1) {
            return bestHeuristic[0] as IndustryType;
        }

        // 2. AI Fallback (If ambiguous) - Phase 105: Prompt Governance + Phase 2: Retry + Tracing
        let renderedPrompt: string;
        let modelName = 'gemini-1.5-flash';

        try {
            const { text: promptText, model } = await PromptService.getRenderedPrompt(
                'DOMAIN_DETECTOR',
                { text: text.substring(0, 3000) },
                tenantId,
                'PRODUCTION',
                'GENERIC',
                session
            );
            renderedPrompt = promptText;
            modelName = model;
        } catch (error) {
            console.warn(`[DOMAIN_ROUTER] ⚠️ Fallback to Master Prompt:`, error);
            await logEvento({
                level: 'WARN',
                source: 'DOMAIN_ROUTER',
                action: 'PROMPT_FALLBACK',
                message: 'Usando prompt maestro por error en BD',
                correlationId: correlationId || 'domain-router-fallback',
                tenantId
            });
            renderedPrompt = PROMPTS.DOMAIN_DETECTOR.replace('{{text}}', text.substring(0, 3000));
        }

        // Phase 2: Wrap LLM call with retry + tracing + cost tracking
        const { IngestTracer } = await import('@/services/ingest/observability/IngestTracer');
        const { withLLMRetry } = await import('@/lib/llm-retry');
        const { LLMCostTracker } = await import('@/services/ingest/observability/LLMCostTracker');

        const span = IngestTracer.startIndustryDetectionSpan({
            correlationId: correlationId || 'domain-router-system',
            tenantId,
        });

        try {
            const startTime = Date.now();

            const response = await withLLMRetry(
                () => callGeminiMini(renderedPrompt, tenantId, {
                    correlationId: correlationId || 'domain-router-system',
                    model: modelName
                }),
                {
                    operation: 'INDUSTRY_DETECTION',
                    tenantId,
                    correlationId: correlationId || 'domain-router-system',
                },
                {
                    maxRetries: 3,
                    timeoutMs: 10000, // 10s timeout (matches SLA)
                }
            );

            const durationMs = Date.now() - startTime;
            const detected = response.trim().toUpperCase();

            // Estimate tokens (rough approximation: 1 token ~= 4 chars)
            const inputTokens = Math.ceil(renderedPrompt.length / 4);
            const outputTokens = Math.ceil(response.length / 4);

            // Track cost
            await LLMCostTracker.trackOperation(
                correlationId || 'domain-router-system',
                'INDUSTRY_DETECTION',
                modelName,
                inputTokens,
                outputTokens,
                durationMs
            );

            // End span success
            await IngestTracer.endSpanSuccess(span, {
                correlationId: correlationId || 'domain-router-system',
                tenantId,
            }, {
                'llm.tokens.input': inputTokens,
                'llm.tokens.output': outputTokens,
                'llm.model': modelName,
                'detected.industry': detected,
            });

            const validIndustries: IndustryType[] = ['ELEVATORS', 'LEGAL', 'BANKING', 'INSURANCE', 'IT', 'MEDICAL', 'GENERIC'];
            if (validIndustries.includes(detected as IndustryType)) {
                return detected as IndustryType;
            }
        } catch (error: any) {
            await IngestTracer.endSpanError(span, {
                correlationId: correlationId || 'domain-router-system',
                tenantId,
            }, error);

            console.error('[DOMAIN ROUTER ERROR]', error);
        }

        return 'GENERIC';
    }

    /**
     * Alias for detectIndustry to match the multi-vertical strategy nomenclature.
     */
    static async classifyQuery(query: string, tenantId: string, correlationId?: string): Promise<IndustryType> {
        return this.detectIndustry(query, tenantId, correlationId);
    }
}
