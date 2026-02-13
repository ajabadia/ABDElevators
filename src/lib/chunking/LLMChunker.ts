import { callGeminiMini } from '@/lib/llm';
import { ChunkResult } from './ChunkingOrchestrator';
import { logEvento } from '@/lib/logger';
import { PromptService } from '@/lib/prompt-service';
import { PROMPTS } from '@/lib/prompts';

export interface LLMChunkerOptions {
    industry?: string;
    filename?: string;
}

/**
 * LLMChunker: Chunking inteligente usando LLM (nivel alto).
 * Se utiliza para segmentar el texto siguiendo la estructura lógica de los documentos.
 */
export class LLMChunker {
    static async chunk(text: string, tenantId: string, correlationId: string, metadata?: LLMChunkerOptions): Promise<ChunkResult[]> {
        let renderedPrompt: string;
        const textToSegment = text.substring(0, 15000);

        try {
            const { text: rendered } = await PromptService.getRenderedPrompt(
                'CHUNKING_LLM_CUTTER',
                { text: textToSegment },
                tenantId,
                'PRODUCTION',
                metadata?.industry || 'GENERIC'
            );
            renderedPrompt = rendered;
        } catch (err) {
            console.warn(`[LLM_CHUNKER] ⚠️ Fallback to Master Prompt:`, err);
            renderedPrompt = PROMPTS.CHUNKING_LLM_CUTTER.replace('{{text}}', textToSegment);

            await logEvento({
                level: 'WARN',
                source: 'LLM_CHUNKER',
                action: 'PROMPT_FALLBACK',
                message: 'Using master fallback prompt for CHUNKING_LLM_CUTTER',
                correlationId,
                tenantId,
                details: { error: err instanceof Error ? err.message : String(err) }
            });
        }

        try {
            const aiResponse = await callGeminiMini(renderedPrompt, tenantId, { correlationId, temperature: 0.1 });

            // Intentar extraer el JSON de la respuesta
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('Could not parse AI response as JSON array');
            }

            return JSON.parse(jsonMatch[0]);

        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'LLM_CHUNKER',
                action: 'CHUNK_ERROR',
                message: `LLM Chunking failed: ${error.message}`,
                correlationId,
                tenantId
            });

            // Fallback a algo básico si falla la IA (esto lo maneja el Orchestrator usualmente, pero aquí retornamos vacío o error)
            throw error;
        }
    }
}
