import { PromptRunner } from "@/lib/llm-core/PromptRunner";
import { logEvento } from "@abd/platform-core/server";
import { trace } from '@opentelemetry/api';
import { z } from "zod";

const tracer = trace.getTracer('abd-rag-platform');

export interface ProcessedQuery {
    normalizedQuery: string;
    intent: 'TECHNICAL' | 'GENERAL' | 'NAVIGATIONAL';
    language: string;
    enQuery: string;
    esQuery: string;
}

export class QueryPreprocessor {
    /**
     * Pre-procesa una consulta para mejorar la precisión de la recuperación.
     */
    static async process(query: string, tenantId: string, correlationId: string): Promise<ProcessedQuery> {
        return tracer.startActiveSpan('rag.query_preprocessor', {
            attributes: {
                'tenant.id': tenantId,
                'correlation.id': correlationId,
                'rag.query.original': query
            }
        }, async (span) => {
            try {
                const result = await PromptRunner.runJson<ProcessedQuery>({
                    key: 'RAG_QUERY_PREPROCESSOR',
                    variables: { query },
                    schema: z.any(), // We don't have a specific schema yet, using z.any() for alignment
                    tenantId,
                    correlationId,
                    temperature: 0
                });

                span.setAttributes({
                    'rag.query.normalized': result.normalizedQuery,
                    'rag.query.intent': result.intent,
                    'rag.query.language': result.language
                });

                await logEvento({
                    level: 'DEBUG',
                    source: 'QUERY_PREPROCESSOR',
                    action: 'PROCESS_SUCCESS',
                    message: `Consulta pre-procesada: ${result.intent}`,
                    correlationId,
                    tenantId,
                    details: { original: query, processed: result }
                });

                return result;
            } catch (error) {
                span.recordException(error as Error);
                console.error("[QUERY PREPROCESSOR ERROR]", error);

                // Fallback basic
                return {
                    normalizedQuery: query,
                    intent: 'TECHNICAL' as const,
                    language: 'unknown',
                    enQuery: query,
                    esQuery: query
                };
            } finally {
                span.end();
            }
        });
    }
}
