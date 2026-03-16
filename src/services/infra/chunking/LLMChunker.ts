import { getErrorMessage } from '@/lib/errors-helpers';
import { ChunkingResult, IChunkerStrategy, ChunkingOptions } from './types';
import { logEvento } from '@/lib/logger';
import { callGeminiMini } from '@/services/llm/llm-service';
import { PromptService } from '@/services/llm/prompt-service';

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
            // Rule #12: Prompt Governance - Use PromptService with steering
            const { text: prompt, model, version } = await PromptService.getRenderedPrompt(
                'CHUNKING_LLM_CUTTER',
                { text: safeText },
                options.tenantId,
                'PRODUCTION',
                'GENERIC',
                undefined,
                'DOCUMENT_CHUNKING'
            );

            // Call Gemini
            const responseJson = await callGeminiMini(prompt, options.tenantId, {
                correlationId: options.correlationId,
                temperature: 0.1, // Low temp for precision
                model: model as any
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
                        type: item.type,
                        promptVersion: version // Governance traceability
                    }
                });
            }

            return chunks;

        } catch (error: unknown) {
            await logEvento({
                level: 'ERROR',
                source: 'LLM_CHUNKER',
                action: 'CHUNKING_FAILED',
                message: `LLM Chunking failed: ${getErrorMessage(error)}`,
                correlationId: options.correlationId,
                tenantId: options.tenantId,
                stack: error instanceof Error ? error.stack : undefined
            });

            throw error;
        }
    }
}
