import { callGeminiMini } from '@/lib/llm';
import { IndustryType } from '@/lib/schemas';
import { PromptService } from '@/lib/prompt-service';
import { PROMPTS } from '@/lib/prompts';
import { logEvento } from '@/lib/logger';
import { DEFAULT_MODEL } from '@/lib/constants/ai-models';

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
        REAL_ESTATE: ['property', 'real estate', 'inmobiliaria', 'piso', 'casa', 'local', 'alquiler', 'venta', 'hipoteca', 'nota simple', 'catastro'],
        IT: ['code', 'api', 'server', 'database', 'frontend', 'backend', 'vulnerability', 'deployment', 'cloud', 'software', 'git', 'bug'],
        MEDICAL: ['paciente', 'historial', 'diagnóstico', 'receta', 'tratamiento', 'clínica', 'hospital', 'médico', 'síntoma', 'infection', 'bacterial', 'patient', 'doctor', 'treatment', 'medical'],
        FINANCE: ['finance', 'finanzas', 'finances', 'accounting', 'audit', 'tax', 'ledger', 'portfolio', 'investment'],
        RETAIL: ['retail', 'comercio', 'commerce', 'customer', 'inventory', 'store', 'shop', 'sale', 'refund', 'invoice'],
        MANUFACTURING: ['manufacturing', 'fábrica', 'factory', 'production', 'assembly', 'quality control', 'supply chain', 'oem', 'industrial'],
        ENERGY: ['energy', 'energía', 'power', 'grid', 'utility', 'oil', 'gas', 'renewable', 'electricity', 'solar', 'wind'],
        HEALTHCARE: ['healthcare', 'sanidad', 'medical', 'patient', 'clinical', 'diagnosis', 'hospital', 'nursing'],
        GOVERNMENT: ['government', 'gobierno', 'public', 'tax', 'regulation', 'policy', 'agency', 'municipality'],
        EDUCATION: ['education', 'educación', 'school', 'university', 'student', 'teacher', 'curriculum', 'academic'],
        GENERIC: []
    };

    /**
     * Detects the industry of aiven text.
     */
    static async detectIndustry(
        text: string,
        tenantId: string,
        correlationId?: string,
        session?: any,
        options?: { skipAIFallback?: boolean }
    ): Promise<IndustryType> {
        const lowerText = text.toLowerCase();
        const cid = correlationId || 'domain-router-system';

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
        if (options?.skipAIFallback) {
            await logEvento({
                level: 'INFO',
                source: 'DOMAIN_ROUTER',
                action: 'AI_FALLBACK_SKIPPED',
                message: 'Saltando IA de detección de industria por modo simple/heurístico',
                correlationId: cid,
                tenantId
            });
            return 'GENERIC';
        }

        let renderedPrompt: string;
        let modelName: string = DEFAULT_MODEL;

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
            modelName = model || DEFAULT_MODEL;
        } catch (error) {
            console.warn(`[DOMAIN_ROUTER] ⚠️ Fallback to Master Prompt:`, error);
            await logEvento({
                level: 'WARN',
                source: 'DOMAIN_ROUTER',
                action: 'PROMPT_FALLBACK',
                message: 'Usando prompt maestro por error en BD',
                correlationId: cid,
                tenantId
            });
            renderedPrompt = (PROMPTS.DOMAIN_DETECTOR?.template || '').replace('{{text}}', text.substring(0, 3000));
        }

        // Phase 2: Wrap LLM call with retry + tracing + cost tracking
        const { IngestTracer } = await import('@/services/ingest/observability/IngestTracer');
        const { withLLMRetry } = await import('@/lib/llm-retry');
        const { LLMCostTracker } = await import('@/services/ingest/observability/LLMCostTracker');

        const span = IngestTracer.startIndustryDetectionSpan({
            correlationId: cid,
            tenantId,
        });

        try {
            const startTime = Date.now();

            const response = await withLLMRetry(
                () => callGeminiMini(renderedPrompt, tenantId, {
                    correlationId: cid,
                    model: modelName
                }),
                {
                    operation: 'INDUSTRY_DETECTION',
                    tenantId,
                    correlationId: cid,
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
                cid,
                'INDUSTRY_DETECTION',
                modelName,
                inputTokens,
                outputTokens,
                durationMs
            );

            // End span success
            await IngestTracer.endSpanSuccess(span, {
                correlationId: cid,
                tenantId,
            }, {
                'llm.tokens.input': inputTokens,
                'llm.tokens.output': outputTokens,
                'llm.model': modelName,
                'detected.industry': detected,
            });

            const validIndustries: IndustryType[] = ['ELEVATORS', 'LEGAL', 'BANKING', 'INSURANCE', 'IT', 'MEDICAL', 'GENERIC', 'REAL_ESTATE'];
            if (validIndustries.includes(detected as IndustryType)) {
                return detected as IndustryType;
            }
        } catch (error: any) {
            await IngestTracer.endSpanError(span, {
                correlationId: cid,
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
        return this.detectIndustry(query, tenantId, correlationId, undefined, { skipAIFallback: false });
    }
}
