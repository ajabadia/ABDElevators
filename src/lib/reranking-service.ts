import { PromptService } from "@/lib/prompt-service";
import { callGeminiMini } from "@/lib/llm";
import { logEvento } from "@/lib/logger";
import { trace } from '@opentelemetry/api';
import { PROMPTS } from "./prompts";
import { RagResult } from "./rag-service";

const tracer = trace.getTracer('abd-rag-platform');

export class RerankingService {
    /**
     * Re-ordena los resultados usando Gemini para máxima precisión técnica.
     */
    static async rerankResults(
        query: string,
        results: RagResult[],
        tenantId: string,
        correlationId: string,
        limit: number,
        industry: string = 'ELEVATORS'
    ): Promise<RagResult[]> {
        return tracer.startActiveSpan('rag.reranking', {
            attributes: {
                'tenant.id': tenantId,
                'correlation.id': correlationId,
                'rag.results.initial_count': results.length,
                'rag.limit': limit,
                'rag.industry': industry
            }
        }, async (span) => {
            if (results.length <= 1) return results;

            let renderedPrompt: string;
            let modelName = 'gemini-1.5-flash';

            try {
                const fragments = results.map((r, i) => `[${i}] ${r.text.substring(0, 600)}`).join('\n\n---\n\n');
                const { text: promptText, model } = await PromptService.getRenderedPrompt('RAG_RERANKER', {
                    query,
                    fragments,
                    count: results.length,
                    industry
                }, tenantId, 'PRODUCTION', industry as any);
                renderedPrompt = promptText;
                modelName = model;
            } catch (error) {
                console.warn(`[RERANKING_SERVICE] ⚠️ Fallback to Master Prompt:`, error);
                await logEvento({
                    level: 'WARN',
                    source: 'RERANKING_SERVICE',
                    action: 'PROMPT_FALLBACK',
                    message: 'Usando prompt maestro por error en BD',
                    correlationId,
                    tenantId
                });
                const fragments = results.map((r, i) => `[${i}] ${r.text.substring(0, 600)}`).join('\n\n---\n\n');
                renderedPrompt = PROMPTS.RAG_RERANKER
                    .replace('{{query}}', query)
                    .replace('{{fragments}}', fragments)
                    .replace('{{count}}', String(results.length))
                    .replace(new RegExp('{{industry}}', 'g'), industry);
            }

            try {
                const response = await callGeminiMini(renderedPrompt, tenantId, { correlationId, model: modelName });
                const cleanResponse = response.replace(/```json|```/g, '').trim();
                const ranking = JSON.parse(cleanResponse) as { index: number; score: number; reason: string }[];

                // Unificar con los objetos originales y ordenar
                const reranked = ranking
                    .map(rank => {
                        const original = results[rank.index];
                        if (!original) return null;
                        return {
                            ...original,
                            score: rank.score,
                            rerankReason: rank.reason
                        } as RagResult & { rerankReason: string };
                    })
                    .filter((r): r is RagResult & { rerankReason: string } => r !== null)
                    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                    .slice(0, limit);

                span.setAttribute('rag.results.final_count', reranked.length);

                await logEvento({
                    level: 'DEBUG',
                    source: 'RERANKING_SERVICE',
                    action: 'RERANK_SUCCESS',
                    message: `Re-ranking completado para ${reranked.length} resultados`,
                    correlationId,
                    tenantId
                });

                return reranked as RagResult[];
            } catch (error) {
                span.recordException(error as Error);
                console.error("[RERANKING ERROR]", error);

                await logEvento({
                    level: 'ERROR',
                    source: 'RERANKING_SERVICE',
                    action: 'RERANK_ERROR',
                    message: (error as Error).message,
                    correlationId,
                    tenantId
                });

                return results.slice(0, limit); // Fallback to original top-K
            } finally {
                span.end();
            }
        });
    }
}
