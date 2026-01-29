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
        correlacion_id: string
    ): Promise<{ results: RagResult[]; aiSynthesis: string }> {
        const start = Date.now();
        try {
            // 1. Buscamos en el espacio "global" o marcado como compartido
            // Nota: En un sistema real, esto filtraría por una flag 'isAnonymized: true' 
            // que atraviesa múltiples tenants. Aquí usamos el proxy de 'tenantId: global' 
            // y simulamos el acceso horizontal.

            const results = await performTechnicalSearch(query, 'global', correlacion_id, 3);

            if (results.length === 0) {
                return { results: [], aiSynthesis: "No se ha encontrado conocimiento compartido relevante para esta consulta." };
            }

            // 2. IA Agent: Sintetizar conocimiento de múltiples fuentes anónimas
            const contextText = results.map((r, i) => `[Fuente ${i + 1}]: ${r.texto}`).join('\n\n');
            const prompt = `
                Actúa como un Especialista en Conocimiento Cruzado de ABDElevators.
                He encontrado los siguientes fragmentos de conocimiento ANÓNIMOS de otras verticales:
                ${contextText}

                Query del usuario: "${query}"

                Tu tarea:
                - Sintetiza una respuesta técnica útil basada SOLO en estos fragmentos.
                - Mantén el anonimato (no menciones clientes ni nombres específicos si aparecieran).
                - Sé crítico: si los fragmentos son contradictorios, indícalo.
            `;

            const aiSynthesis = await callGeminiMini(prompt, tenantId, { correlacion_id, temperature: 0.3 });

            await logEvento({
                nivel: 'INFO',
                origen: 'CROSS_VERTICAL_SEARCH',
                accion: 'SEARCH_SUCCESS',
                mensaje: `Búsqueda horizontal completada para: ${query}`,
                correlacion_id,
                detalles: { hits: results.length, duration: Date.now() - start }
            });

            return { results, aiSynthesis };

        } catch (error: any) {
            console.error('[CrossVerticalEngine] Error:', error);
            return { results: [], aiSynthesis: "Error al procesar la búsqueda horizontal." };
        }
    }
}
