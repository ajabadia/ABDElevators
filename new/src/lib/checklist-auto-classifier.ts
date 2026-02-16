// lib/checklist-auto-classifier.ts
// Auto-classifies checklist items into categories based on keywords defined in a ChecklistConfig.
// Implements Zod validation, structured logging, and performance measurement per the project's "Reglas de Oro".

import { z } from "zod";
import { logEvento } from "@/lib/logger";
import { ValidationError } from "@/lib/errors";
import {
    ChecklistConfigSchema,
    ChecklistConfig,
    ChecklistItem
} from "@/lib/schemas";


const ChecklistItemInputSchema = z.object({
    id: z.string().uuid(),
    description: z.string().min(1),
    categoryId: z.string().uuid().nullable().optional(),
    notes: z.string().optional()
});


/**
 * Auto‑classifies a single checklist item based on keyword matching.
 * Returns the matching category id or null if no match is found.
 */
export function autoClassify(
    item: ChecklistItem,
    config: ChecklistConfig,
    correlationId: string
): string | null {
    // Validate inputs first
    const parsedItem = ChecklistItemInputSchema.safeParse(item);

    if (!parsedItem.success) {
        throw new ValidationError("Invalid checklist item supplied to autoClassify", parsedItem.error);
    }

    const parsedConfig = ChecklistConfigSchema.safeParse(config);
    if (!parsedConfig.success) {
        throw new ValidationError("Invalid checklist config supplied to autoClassify", parsedConfig.error);
    }

    const descriptionLower = item.description.toLowerCase();
    // Simple keyword matching: first category whose any keyword appears in description.
    for (const category of config.categories) {
        for (const kw of category.keywords) {
            if (descriptionLower.includes(kw.toLowerCase())) {
                return category.id;
            }
        }
    }
    return null;
}

/**
 * Sorts checklist items according to the configuration's category priority and, optionally, document score.
 * Items without a category are placed at the end.
 */
export function smartSort(
    items: ChecklistItem[],
    config: ChecklistConfig,
    correlationId: string
): ChecklistItem[] {
    const start = Date.now();

    const parsedConfig = ChecklistConfigSchema.safeParse(config);
    if (!parsedConfig.success) {
        throw new ValidationError("Invalid checklist config supplied to smartSort", parsedConfig.error);
    }

    // Build a map of categoryId -> priority for quick lookup
    const priorityMap: Record<string, number> = {};
    for (const cat of config.categories) {
        priorityMap[cat.id] = cat.priority;
    }

    const sorted = [...items].sort((a, b) => {
        const aPri = a.categoryId ? priorityMap[a.categoryId] ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
        const bPri = b.categoryId ? priorityMap[b.categoryId] ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
        if (aPri !== bPri) {
            return aPri - bPri; // lower priority number first
        }
        // Fallback alphabetical by description
        return a.description.localeCompare(b.description);
    });

    const durationMs = Date.now() - start;
    // Log performance – correlacion_id is not known here; we log without it but keep structure.
    void logEvento({
        level: "INFO",
        source: "CHECKLIST_AUTO_CLASSIFIER",
        action: "SMART_SORT",
        message: `Sorted ${items.length} items`, correlationId,
        details: { duration_ms: durationMs }
    });

    return sorted;
}
