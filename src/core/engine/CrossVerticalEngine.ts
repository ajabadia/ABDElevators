import { performTechnicalSearch, RagResult } from '@/lib/rag-service';
import { logEvento } from '@/lib/logger';
import { callGeminiMini } from '@/lib/llm';

/**
 * CrossVerticalEngine: Permite la búsqueda semántica horizontal entre diferentes tenantes.
 * Mantiene el anonimato y la privacidad de los datos sensibles.
 * (Fase KIMI 11)
 */
export class CrossVerticalEngine {
    private static instance: CrossVerticalEngine;

    private constructor() { }

    public static getInstance(): CrossVerticalEngine {
        if (!CrossVerticalEngine.instance) {
            CrossVerticalEngine.instance = new CrossVerticalEngine();
        }
        return CrossVerticalEngine.instance;
    }

    /**
     * Realiza una búsqueda de "Conocimiento Compartido" (Anonymized Horizontal Search).
     */
    public async semanticHorizontalSearch(
        query: string,
        tenantId: string,
        correlationId: string
    ): Promise<{ results: RagResult[]; aiSynthesis: string }> {
        const start = Date.now();
        try {
            // 1. Buscamos en el espacio "global" o marcado como compartido
            // Nota: En un sistema real, esto filtraría por una flag 'isAnonymized: true' 
            // que atraviesa múltiples tenants. Aquí usamos el proxy de 'tenantId: global' 
            // y simulamos el acceso horizontal.

            const results = await performTechnicalSearch(query, 'global', correlationId, 3);

            if (results.length === 0) {
                return { results: [], aiSynthesis: "No shared knowledge found relevant to this query." };
            }

            // 2. IA Agent: Synthesize knowledge from multiple anonymous sources
            const contextText = results.map((r, i) => `[Source ${i + 1}]: ${r.text}`).join('\n\n');
            const prompt = `
                Act as a Cross-Vertical Knowledge Specialist for ABDElevators.
                I have found the following ANONYMOUS knowledge chunks from other verticals:
                ${contextText}

                User Query: "${query}"

                Your task:
                - Synthesize a useful technical response based ONLY on these chunks.
                - Maintain anonymity (do not mention clients or specific names if they appear).
                - Be critical: if the chunks are contradictory, indicate it.
            `;

            const aiSynthesis = await callGeminiMini(prompt, tenantId, { correlationId, temperature: 0.3 });

            await logEvento({
                level: 'INFO',
                source: 'CROSS_VERTICAL_SEARCH',
                action: 'SEARCH_SUCCESS',
                message: `Horizontal search completed for: ${query}`,
                correlationId,
                details: { hits: results.length, duration: Date.now() - start }
            });

            return { results, aiSynthesis };

        } catch (error: any) {
            console.error('[CrossVerticalEngine] Error:', error);
            return { results: [], aiSynthesis: "Error al procesar la búsqueda horizontal." };
        }
    }
}
