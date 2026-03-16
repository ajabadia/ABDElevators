// lib/checklist-extractor.ts
// Extracts checklist items from a set of relevant documents using a lightweight LLM prompt.
// This module follows the project's "Reglas de Oro" (strict TypeScript, Zod validation, AppError, structured logging).

import { PromptRunner } from "@/lib/llm-core/PromptRunner";
import { z } from "zod";
import { logEvento } from "@/lib/logger";
import { AppError, ValidationError, ExternalServiceError } from "@/lib/errors";
import { ChecklistItem } from "@/lib/types";

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
 * @param correlationId - UUID used for structured logging and tracing.
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
 * @param correlationId - UUID used for structured logging and tracing.
 * @param llmCaller - Optional dependency injection for the LLM call (defaults to callGeminiMini).
 * @returns Promise resolving to an array of {@link ChecklistItem} objects.
 * @throws {@link ValidationError} if input validation fails.
 * @throws {@link ExternalServiceError} if the LLM call fails.
 */
export async function extractChecklist(
    docs: { id: string; content: string }[],
    tenantId: string,
    correlationId: string
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
        // 2️⃣ Prepare Context
        const documentsText = docs.map((d) => `Document ${d.id}:\n${d.content}`).join("\n---DOC---\n");
        
        // 3️⃣ Define Schema for PromptRunner
        const InternalItemSchema = z.object({
            id: z.string().uuid(),
            description: z.string().min(1),
            confidence: z.number().min(0).max(1).optional(),
            confidenceLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
            ragReference: z.string().optional()
        });
        const ChecklistArraySchema = z.array(InternalItemSchema);

        // 4️⃣ Execute via PromptRunner (Governance + Traceability)
        const parsedItems = await PromptRunner.runJson({
            key: 'CHECKLIST_EXTRACTION',
            variables: { text: documentsText },
            schema: ChecklistArraySchema,
            tenantId,
            correlationId
        });

        return parsedItems as ChecklistItem[];
    } catch (error) {
        // Log error before re‑throwing
        await logEvento({
            level: "ERROR",
            source: "CHECKLIST_EXTRACTOR",
            action: "EXTRACT_ERROR",
            message: "Error during checklist extraction",
            correlationId,
            details: { error: (error as Error).message },
            stack: (error as Error).stack
        });
        
        if (error instanceof AppError) {
            throw error;
        }
        throw new ExternalServiceError("Unexpected error in checklist extraction", error as Error);
    }
}
