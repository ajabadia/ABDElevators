import { ChunkingResult, IChunkerStrategy, ChunkingOptions } from './types';
import { callGemini } from '@/lib/llm';
import { PROMPTS } from '@/lib/prompts';
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

        // If text is massive, we might need to pre-split it blindly or recursivley.
        // For V1, let's assume we process it in blocks if needed, but LLM chunking is usually for specific sections.
        // Let's implement a sliding window for the LLM call if text > maxInputSize

        // For simplicity in Phase 134: We warn if text is too big and process the first block, 
        // or we split by paragraphs first and batch. 
        // Better approach: Use SimpleChunker to get manageable blocks (e.g. 5k chars) and then Refine with LLM?
        // No, the prompt "divides" the text. 

        // Strategy: Split into large blocks (e.g. 5000 chars) with overlap, and ask LLM to chunk each block.
        // Then deduplicate? Complex.

        // Simplified Strategy for V1: 
        // We assume the input text passed to `chunk()` is a "Document Component" or a "Page".
        // If it's a huge book, the caller should have split it by pages. 
        // We will just truncate if it exceeds safety limits to avoid crashing.

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
            const responseJson = await callGemini(prompt, options.tenantId, options.correlationId, {
                temperature: 0.1, // Low temp for precision
                model: 'gemini-2.5-flash' // Phase 197: Use Flash for cost and speed
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
                const chunkText = item.texto;
                if (!chunkText) continue;

                // Find exact location in original text to ensure metadata accuracy
                // We search starting from where the last one ended to preserve order
                const foundIndex = text.indexOf(chunkText, searchStartIndex);

                let finalStartIndex = foundIndex;
                let finalEndIndex = foundIndex + chunkText.length;

                if (foundIndex === -1) {
                    // LLM hallucinated or modified text slightly. 
                    // Fallback: Just use the text provided by LLM and approximate/omit indices or set to -1
                    // Or better: Fuzzy match? Too heavy.
                    // We'll mark as "generated" logic.
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
                        title: item.titulo,
                        type: item.tipo
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

            // Fallback to SimpleChunker logic in case of failure?
            // Or return empty to let Orchestrator handle?
            // Let's throw to let Orchestrator fallback.
            throw error;
        }
    }
}
