import { IndustryType, IndustryTypeSchema } from './schemas';
import { callGeminiMini } from './llm';
import { PromptService } from './prompt-service';
import { logEvento } from './logger';
import { AppError } from './errors';

/**
 * DomainRouter: Active Query Classification (Phase 101.1)
 * Decides the target vertical for a given query to improve retrieval precision.
 */
export class DomainRouter {
    /**
     * Classifies a query into a business industry (domain)
     * @param query The user's input query
     * @param tenantId Tenant ID for context
     * @param correlationId For tracing
     */
    static async classifyQuery(
        query: string,
        tenantId: string,
        correlationId: string
    ): Promise<IndustryType> {
        const start = Date.now();

        try {
            // 1. Get Domain Detection Prompt (Masters from PROMPTS or DB)
            const { text: prompt } = await PromptService.getRenderedPrompt(
                'DOMAIN_DETECTOR',
                { text: query },
                tenantId
            );

            // 2. Call LLM for classification
            const response = await callGeminiMini(prompt, tenantId, {
                correlationId,
                temperature: 0, // Deterministic
                model: 'gemini-1.5-flash'
            });

            // 3. Clean and Validate Response
            const cleanDomain = response.trim().toUpperCase();

            // Check if it's a valid IndustryType
            const validation = IndustryTypeSchema.safeParse(cleanDomain);

            if (!validation.success) {
                await logEvento({
                    level: 'WARN',
                    source: 'DOMAIN_ROUTER',
                    action: 'CLASSIFICATION_FALLBACK',
                    message: `Invalid domain detected: "${cleanDomain}". Falling back to GENERIC.`,
                    correlationId,
                    details: { response, query }
                });
                return 'GENERIC';
            }

            const duration = Date.now() - start;

            await logEvento({
                level: 'INFO',
                source: 'DOMAIN_ROUTER',
                action: 'CLASSIFY_QUERY',
                message: `Query classified as ${validation.data}`,
                correlationId,
                details: {
                    query,
                    domain: validation.data,
                    duration_ms: duration,
                    model: 'gemini-1.5-flash'
                }
            });

            return validation.data;

        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'DOMAIN_ROUTER',
                action: 'CLASSIFICATION_ERROR',
                message: `Failed to classify query: ${error.message}`,
                correlationId,
                details: { query }
            });

            // Fail safe to GENERIC in production, but keep tracing
            return 'GENERIC';
        }
    }

    /**
     * Suggests a vector space index based on the domain (Future expansion)
     */
    static getTargetVectorSpace(domain: IndustryType): string {
        switch (domain) {
            case 'LEGAL': return 'vectors_legal';
            case 'BANKING': return 'vectors_banking';
            case 'INSURANCE': return 'vectors_insurance';
            case 'ELEVATORS': return 'vectors_elevators';
            case 'MEDICAL': return 'vectors_medical';
            default: return 'vectors_main';
        }
    }
}
