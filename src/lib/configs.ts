// lib/configs.ts
// Helper utilities for fetching checklist configurations from MongoDB.
// Implements strict TypeScript, Zod validation, AppError handling, and structured logging.

import { z } from "zod";
import { connectDB } from "@/lib/db";
import { logEvento } from "@/lib/logger";
import { NotFoundError, DatabaseError, ValidationError } from "@/lib/errors";
import { ChecklistConfigSchema, ChecklistConfig } from "@/lib/schemas";
import { ObjectId } from "mongodb";




/**
 * Retrieves a checklist configuration by its identifier.
 * If `id` is "default", returns the built‑in default configuration.
 */
export async function getChecklistConfigById(id: string, correlacion_id_opt?: string): Promise<ChecklistConfig> {
    const correlacion_id = correlacion_id_opt || crypto.randomUUID();
    const start = Date.now();
    try {
        if (id === "default") {
            // Lazy import to avoid circular dependencies if default config is defined elsewhere.
            const { defaultChecklistConfig } = await import("./default-checklist-config");
            return defaultChecklistConfig;
        }

        const db = await connectDB();
        const collection = db.collection("configs_checklist");
        const raw = await collection.findOne({ _id: new (await import("mongodb")).ObjectId(id) });
        if (!raw) {
            throw new NotFoundError(`Checklist config with id ${id} not found`);
        }
        const parsed = ChecklistConfigSchema.parse(raw);
        // Transform to the ChecklistConfig interface (omit _id)
        const config: ChecklistConfig = {
            nombre: parsed.nombre,
            categorias: parsed.categorias,
            workflow_orden: parsed.workflow_orden,
            activo: parsed.activo,
            tenantId: parsed.tenantId,
            creado: parsed.creado,
            actualizado: parsed.actualizado
        };

        await logEvento({
            nivel: "INFO",
            origen: "CONFIGS_SERVICE",
            accion: "GET",
            mensaje: `Fetched checklist config ${id}`,
            correlacion_id,
            detalles: { duration_ms: Date.now() - start }
        });
        return config;
    } catch (error) {
        await logEvento({
            nivel: "ERROR",
            origen: "CONFIGS_SERVICE",
            accion: "GET",
            mensaje: `Error fetching checklist config ${id}`,
            correlacion_id,
            detalles: { error: (error as Error).message },
            stack: (error as Error).stack
        });
        if (error instanceof NotFoundError) {
            throw error;
        }
        // Wrap any other error as DatabaseError
        throw new DatabaseError("Failed to retrieve checklist config", error as Error);
    }
}
