import { ChunkingResult, IChunkerStrategy, ChunkingOptions } from './types';
import { logEvento } from '@/lib/logger';
import { callGeminiMini } from '@/services/llm/llm-service';
import { AI_MODEL_IDS } from '@/lib/constants/ai-models';
import { PROMPTS } from '@/lib/prompts';

export class LLMChunker implements IChunkerStrategy {
    level = 'LLM' as const;

    // Max characters to send to LLM in one go to avoid context limits or timeouts
    private maxInputSize = 12000;

    async chunk(text: string, options: ChunkingOptions): Promise<ChunkingResult[]> {
        // If text is too small, just return it
        if (text.length < 500) {
            return [{
                text,
                metadata: { startIndex: 0, endIndex: text.length, tokens: Math.ceil(text.length / 4) }
            }];
        }

        const safeText = text.slice(0, this.maxInputSize);
        if (text.length > this.maxInputSize) {
            await logEvento({
                level: 'WARN',
                source: 'LLM_CHUNKER',
                action: 'TEXT_TRUNCATED',
                message: `Text too long for LLM Chunker (${text.length} chars). Truncated to ${this.maxInputSize}.`,
                correlationId: options.correlationId,
                tenantId: options.tenantId
            });
        }

        try {
            const prompt = PROMPTS.CHUNKING_LLM_CUTTER.template.replace('{{text}}', safeText);

            // Call Gemini
            const responseJson = await callGeminiMini(prompt, options.tenantId, {
                correlationId: options.correlationId,
                temperature: 0.1, // Low temp for precision
                model: AI_MODEL_IDS.GEMINI_2_5_FLASH // Phase 197: Use Flash for cost and speed
            });

            // Parse JSON
            const cleanedJson = responseJson.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanedJson);

            if (!parsed.chunks || !Array.isArray(parsed.chunks)) {
                throw new Error('Invalid JSON structure from LLM');
            }

            const chunks: ChunkingResult[] = [];
            let searchStartIndex = 0;

            for (const item of parsed.chunks) {
                const chunkText = item.text;
                if (!chunkText) continue;

                // Find exact location in original text to ensure metadata accuracy
                const foundIndex = text.indexOf(chunkText, searchStartIndex);

                let finalStartIndex = foundIndex;
                let finalEndIndex = foundIndex + chunkText.length;

                if (foundIndex === -1) {
                    finalStartIndex = searchStartIndex; // Estimate
                    finalEndIndex = searchStartIndex + chunkText.length;
                } else {
                    searchStartIndex = finalEndIndex;
                }

                chunks.push({
                    text: chunkText,
                    metadata: {
                        startIndex: finalStartIndex,
                        endIndex: finalEndIndex,
                        tokens: Math.ceil(chunkText.length / 4),
                        title: item.title,
                        type: item.type
                    }
                });
            }

            return chunks;

        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'LLM_CHUNKER',
                action: 'CHUNKING_FAILED',
                message: `LLM Chunking failed: ${error.message}`,
                correlationId: options.correlationId,
                tenantId: options.tenantId,
                stack: error.stack
            });

            throw error;
        }
    }
}
