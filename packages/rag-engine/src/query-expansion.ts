
import { PromptService } from "@/services/llm/prompt-service";
import { callGeminiMini } from "@/services/llm/llm-service";
import { logEvento } from "@abd/platform-core/server";
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('abd-rag-platform');

export class QueryExpansionService {
    /**
     * Expande una consulta técnica usando Gemini para mejorar el recall.
     */
    static async expandQuery(query: string, tenantId: string, correlationId: string): Promise<string[]> {
        return tracer.startActiveSpan('rag.query_expansion', {
            attributes: {
                'tenant.id': tenantId,
                'correlation.id': correlationId,
                'rag.query.original': query
            }
        }, async (span) => {
            try {
                const { production, shadow } = await PromptService.getPromptWithShadow('QUERY_EXPANDER', { query }, tenantId);

                if (shadow) {
                    const { runShadowCall } = await import("@/lib/gemini-client");
                    runShadowCall(shadow.text, shadow.model, tenantId, correlationId, 'QUERY_EXPANDER', shadow.key).catch(e =>
                        console.error("[EXPANDER SHADOW ERROR]", e)
                    );
                }

                const response = await callGeminiMini(production.text, tenantId, { correlationId, model: production.model });

                const variations = response
                    .split('\n')
                    .map(v => v.trim())
                    .filter(v => v.length > 0 && v !== query);

                span.setAttribute('rag.query.variations_count', variations.length);

                await logEvento({
                    level: 'DEBUG',
                    source: 'QUERY_EXPANSION_SERVICE',
                    action: 'EXPAND_SUCCESS',
                    message: `Consulta expandida en ${variations.length} variantes`,
                    correlationId,
                    tenantId,
                    details: { original: query, variations }
                });

                return variations;
            } catch (error) {
                span.recordException(error as Error);
                console.error("[QUERY EXPANSION ERROR]", error);
                return []; // Fallback empty
            } finally {
                span.end();
            }
        });
    }
}
