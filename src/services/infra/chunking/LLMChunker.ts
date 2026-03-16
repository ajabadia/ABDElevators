import { getErrorMessage } from '@/lib/errors-helpers';
import { ChunkingResult, IChunkerStrategy, ChunkingOptions } from './types';
import { PromptRunner } from "@/lib/llm-core/PromptRunner";
import { z } from "zod";
import { logEvento } from '@/lib/logger';

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
            // Define Schema for Chunker Output
            const ChunkerOutputSchema = z.object({
                chunks: z.array(z.object({
                    text: z.string(),
                    title: z.string().optional(),
                    type: z.enum(['section', 'paragraph', 'list']).optional()
                }))
            });

            // Rule #12: Prompt Governance - Use PromptRunner.runJson
            const parsed = await PromptRunner.runJson({
                key: 'CHUNKING_LLM_CUTTER',
                variables: { text: safeText },
                schema: ChunkerOutputSchema,
                tenantId: options.tenantId,
                correlationId: options.correlationId
            });

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
                        type: item.type as 'section' | 'paragraph' | 'list'
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
