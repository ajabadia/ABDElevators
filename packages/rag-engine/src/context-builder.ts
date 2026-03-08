import { RagResult } from "./types";
import { ProcessedQuery } from "./query-preprocessor";

export interface ContextOptions {
    maxTokens?: number;
    includeSummaries?: boolean;
}

export class ContextBuilder {
    /**
     * Construye un bloque de contexto estructurado para el LLM.
     */
    static build(
        query: ProcessedQuery,
        chunks: RagResult[],
        options: ContextOptions = {}
    ): string {
        const { maxTokens = 3000, includeSummaries = true } = options;

        let context = `CONSULTA NORMALIZADA: ${query.normalizedQuery}\n`;
        context += `INTENCIÓN DETECTADA: ${query.intent}\n\n`;
        context += `--- INICIO CONTEXTO DOCUMENTAL ---\n\n`;

        let currentTokens = Math.ceil(context.length / 4);

        // Agrupar chunks por fuente para evitar redundancia de headers
        const bySource = chunks.reduce((acc, chunk) => {
            if (!acc[chunk.source]) acc[chunk.source] = [];
            acc[chunk.source].push(chunk);
            return acc;
        }, {} as Record<string, RagResult[]>);

        for (const [source, sourceChunks] of Object.entries(bySource)) {
            const sourceHeader = `[FUENTE: ${source}]\n`;
            if (currentTokens + Math.ceil(sourceHeader.length / 4) > maxTokens) break;

            context += sourceHeader;
            currentTokens += Math.ceil(sourceHeader.length / 4);

            for (const chunk of sourceChunks) {
                let chunkText = "";

                // Si es jerárquico, incluimos info de sección
                if (chunk.sectionId) {
                    chunkText += `[SECCIÓN: ${chunk.sectionTitle || 'Sin título'}] (Nivel ${chunk.sectionLevel || '?'})\n`;
                    if (chunk.sectionSummary && includeSummaries) {
                        chunkText += `[RESUMEN SECCIÓN]: ${chunk.sectionSummary}\n`;
                    }
                }

                chunkText += `${chunk.text}\n\n`;

                const tokens = Math.ceil(chunkText.length / 4);
                if (currentTokens + tokens > maxTokens) break;

                context += chunkText;
                currentTokens += tokens;
            }

            context += `--- FIN DE FUENTE ---\n\n`;
        }

        context += `--- FIN CONTEXTO DOCUMENTAL ---`;
        return context;
    }
}
