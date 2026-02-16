// lib/configs.ts
// Helper utilities for fetching checklist configurations from MongoDB.
// Implements strict TypeScript, Zod validation, AppError handling, and structured logging.

import { z } from "zod";
import { connectDB } from "@/lib/db";
import { logEvento } from "@/lib/logger";
import { NotFoundError, DatabaseError, ValidationError } from "@/lib/errors";
import { ChecklistConfigSchema, ChecklistConfig } from "@/lib/schemas";
import { ObjectId } from "mongodb";
import { getTenantCollection } from "@/lib/db-tenant";

/**
 * Retrieves a checklist configuration by its identifier.
 * If `id` is "default", returns the built-in default configuration.
 * Multi-tenant safe via getTenantCollection.
 */
export async function getChecklistConfigById(id: string, session?: any, correlationId?: string): Promise<ChecklistConfig> {
    const start = Date.now();
    const effectiveCorrelationId = correlationId || crypto.randomUUID();
    try {
        if (id === "default") {
            const { defaultChecklistConfig } = await import("./default-checklist-config");
            return defaultChecklistConfig;
        }

        const collection = await getTenantCollection("configs_checklist", session);

        const raw = await collection.findOne({ _id: new ObjectId(id) });
        if (!raw) {
            throw new NotFoundError(`Checklist config with id ${id} not found`);
        }

        const parsed = ChecklistConfigSchema.parse(raw);
        return parsed;
    } catch (error) {
        await logEvento({
            level: "ERROR",
            source: "CONFIGS_SERVICE",
            action: "GET",
            message: `Error fetching checklist config ${id}`,
            correlationId: effectiveCorrelationId,
            details: { error: (error as Error).message },
            stack: (error as Error).stack
        });
        if (error instanceof NotFoundError || error instanceof ValidationError) {
            throw error;
        }
        throw new DatabaseError("Failed to retrieve checklist config", error as Error);
    }
}
