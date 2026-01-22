// lib/checklist-extractor.ts
// Extracts checklist items from a set of relevant documents using a lightweight LLM prompt.
// This module follows the project's "Reglas de Oro" (strict TypeScript, Zod validation, AppError, structured logging).

import { z } from "zod";
import { logEvento } from "@/lib/logger";
import { AppError, ValidationError, ExternalServiceError } from "@/lib/errors";
import { callGeminiMini } from "@/lib/llm"; // assumed utility for Gemini mini‑prompt
import { ChecklistItem } from "./types";


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
    correlacion_id: z.string().uuid()
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
export async function extractChecklist(
    docs: { id: string; content: string }[],
    tenantId: string,
    correlacion_id: string
): Promise<ChecklistItem[]> {
    // -------------------
    // 1️⃣ Input validation (Zod First)
    // -------------------
    const parsed = ExtractChecklistInputSchema.safeParse({ docs, correlacion_id });
    if (!parsed.success) {
        throw new ValidationError("Invalid input for checklist extraction", parsed.error);
    }

    const start = Date.now();
    try {
        // -------------------
        // 2️⃣ Prepare mini‑prompt for Gemini (LLM optional, low‑cost)
        // -------------------
        const prompt = `You are a specialist extracting actionable checklist items from technical documents.
    Return a JSON array where each element has the shape { "id": "<uuid>", "description": "<text>" }.
    Include only items that a technician must verify for the given order.
    Use the following documents (concatenated, each separated by "---DOC---"):
    ${docs.map((d) => `Document ${d.id}:\n${d.content}`).join("\n---DOC---\n")}`;

        // -------------------
        // 3️⃣ Call the LLM (lightweight mini‑prompt)
        // -------------------
        const rawResponse = await callGeminiMini(prompt, tenantId, { correlacion_id });

        // Assume the response is a JSON string representing ChecklistItem[]
        let items: unknown;
        try {
            items = JSON.parse(rawResponse);
        } catch (e) {
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
            nivel: "INFO",
            origen: "CHECKLIST_EXTRACTOR",
            accion: "EXTRACT",
            mensaje: `Extracted ${parsedItems.length} checklist items`,
            correlacion_id,
            detalles: { duration_ms: durationMs, doc_count: docs.length }
        });

        // -------------------
        // 6️⃣ Return typed result
        // -------------------
        return parsedItems as ChecklistItem[];
    } catch (error) {
        // Log error before re‑throwing
        await logEvento({
            nivel: "ERROR",
            origen: "CHECKLIST_EXTRACTOR",
            accion: "EXTRACT",
            mensaje: "Error during checklist extraction",
            correlacion_id,
            detalles: { error: (error as Error).message },
            stack: (error as Error).stack
        });
        if (error instanceof AppError) {
            throw error; // preserve custom error types
        }
        // Wrap unknown errors
        throw new ExternalServiceError("Unexpected error in checklist extraction", error as Error);
    }
}
