// lib/checklist-extractor.ts
// Extracts checklist items from a set of relevant documents using a lightweight LLM prompt.
// This module follows the project's "Reglas de Oro" (strict TypeScript, Zod validation, AppError, structured logging).

import { z } from "zod";
import { logEvento } from "@/lib/logger";
import { AppError, ValidationError, ExternalServiceError } from "@/lib/errors";
import { callGeminiMini } from "@/lib/llm"; // assumed utility for Gemini mini‑prompt
import { ChecklistItem } from "./types";


import { PromptService } from "./prompt-service";

/**
 * Zod schema for the function input. All inputs are validated before any processing.
 */
const ExtractChecklistInputSchema = z.object({
    docs: z.array(
        z.object({
            id: z.string(),
            content: z.string()
        })
    ),
    correlationId: z.string().uuid(),
    tenantId: z.string()
});

/**
 * Extracts a list of checklist items from the provided documents.
 *
 * @param docs - Array of documents (id + raw text) that are relevant to the order.
 * @param correlacion_id - UUID used for structured logging and tracing.
 * @returns Promise resolving to an array of {@link ChecklistItem} objects.
 * @throws {@link ValidationError} if input validation fails.
 * @throws {@link ExternalServiceError} if the LLM call fails.
 */
/**
 * Type definition for the LLM caller function to allow mocking.
 */
export type LLMCaller = (prompt: string, tenantId: string, options?: any) => Promise<string>;

/**
 * Extracts a list of checklist items from the provided documents.
 *
 * @param docs - Array of documents (id + raw text) that are relevant to the order.
 * @param correlacion_id - UUID used for structured logging and tracing.
 * @param llmCaller - Optional dependency injection for the LLM call (defaults to callGeminiMini).
 * @returns Promise resolving to an array of {@link ChecklistItem} objects.
 * @throws {@link ValidationError} if input validation fails.
 * @throws {@link ExternalServiceError} if the LLM call fails.
 */
export async function extractChecklist(
    docs: { id: string; content: string }[],
    tenantId: string,
    correlationId: string,
    llmCaller: LLMCaller = callGeminiMini
): Promise<ChecklistItem[]> {
    // -------------------
    // 1️⃣ Input validation (Zod First)
    // -------------------
    const parsed = ExtractChecklistInputSchema.safeParse({ docs, correlationId, tenantId });
    if (!parsed.success) {
        throw new ValidationError("Invalid input for checklist extraction", parsed.error);
    }

    const start = Date.now();
    try {
        // 2️⃣ Prepare dynamic prompt (Fase 7.6)
        const documentsText = docs.map((d) => `Document ${d.id}:\n${d.content}`).join("\n---DOC---\n");
        const { text: renderedPrompt } = await PromptService.getRenderedPrompt(
            'checklist_extraction',
            { text: documentsText },
            tenantId
        );

        // -------------------
        // 3️⃣ Call the LLM (lightweight mini‑prompt)
        // -------------------
        const rawResponse = await llmCaller(renderedPrompt, tenantId, { correlationId });

        // Assume the response is a JSON string representing ChecklistItem[]
        let items: unknown;
        try {
            // Cleanup markdown code blocks if present (common LLM artifact)
            const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            items = JSON.parse(cleanJson);
        } catch (e) {
            await logEvento({
                level: "ERROR",
                source: "CHECKLIST_EXTRACTOR",
                action: "EXTRACT_FORMAT_ERROR",
                message: "Failed to parse LLM response as JSON",
                correlationId,
                details: { rawResponse: rawResponse.substring(0, 500) } // Capture snippet for debugging
            });
            throw new ExternalServiceError("Failed to parse LLM response as JSON", e as Error);
        }

        // -------------------
        // 4️⃣ Validate the LLM output against a Zod schema
        // -------------------
        const ChecklistItemSchema = z.object({
            id: z.string().uuid(),
            description: z.string().min(1)
        });
        const ChecklistArraySchema = z.array(ChecklistItemSchema);
        const parsedItems = ChecklistArraySchema.parse(items);

        // -------------------
        // 5️⃣ Structured logging (including duration)
        // -------------------
        const durationMs = Date.now() - start;
        await logEvento({
            level: "INFO",
            source: "CHECKLIST_EXTRACTOR",
            action: "EXTRACT",
            message: `Extracted ${parsedItems.length} checklist items`, correlationId,
            details: { duration_ms: durationMs, doc_count: docs.length }
        });

        // -------------------
        // 6️⃣ Return typed result
        // -------------------
        return parsedItems as ChecklistItem[];
    } catch (error) {
        // Log error before re‑throwing
        await logEvento({
            level: "ERROR",
            source: "CHECKLIST_EXTRACTOR",
            action: "EXTRACT_ERROR",
            message: "Error during checklist extraction", correlationId,
            details: { error: (error as Error).message },
            stack: (error as Error).stack
        });
        if (error instanceof AppError) {
            throw error; // preserve custom error types
        }
        // Wrap unknown errors
        throw new ExternalServiceError("Unexpected error in checklist extraction", error as Error);
    }
}
