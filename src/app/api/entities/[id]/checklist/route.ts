// app/api/pedidos/[id]/checklist/route.ts
// Checklist endpoint for Phase 6 – returns dynamic checklist items for a given order.
// Implements strict TypeScript, Zod validation, AppError handling, structured logging, and performance measurement.

import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";

import { extractChecklist } from "@/lib/checklist-extractor";
import { autoClassify, smartSort } from "@/lib/checklist-auto-classifier";
import { ChecklistItem, ChecklistConfig, Entity } from "@/lib/schemas";
import { logEvento } from "@/lib/logger";
import { AppError, ValidationError, ExternalServiceError, DatabaseError, NotFoundError, handleApiError } from "@/lib/errors";
import { getRelevantDocuments } from "@/lib/rag-service";
import { getChecklistConfigById } from "@/lib/configs";

// ----- Input validation schema -----
const ParamsSchema = z.object({
    id: z.string(), // pedido ID
    config_id: z.string().optional(),
    refresh: z.preprocess((val) => val === 'true', z.boolean()).optional()
});

/**
 * GET /api/pedidos/[id]/checklist?config_id=xxx
 * Returns a sorted list of checklist items for the order.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;

    const correlationId = uuidv4();
    const start = Date.now();

    try {
        const session = await auth();
        if (!session) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        const tenantId = session.user.tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        }

        // Parse query parameters
        const url = new URL(request.url);
        const rawConfigId = url.searchParams.get("config_id");
        const rawRefresh = url.searchParams.get("refresh");
        const parsed = ParamsSchema.safeParse({
            id,
            config_id: rawConfigId ?? undefined,
            refresh: rawRefresh ?? undefined
        });
        if (!parsed.success) {
            throw new ValidationError("Invalid query parameters", parsed.error);
        }
        const { id: entityId, config_id, refresh } = parsed.data;

        // 🛡️ Tenant Isolation Check
        const db = await (await import("@/lib/db")).connectDB();
        const entity = await db.collection('entities').findOne({
            _id: new (await import("mongodb")).ObjectId(entityId)
        });

        if (!entity) {
            throw new NotFoundError(`Entidad ${entityId} no encontrada`);
        }

        if (entity.tenantId && entity.tenantId !== tenantId) {
            await logEvento({
                level: "WARN",
                source: "CHECKLIST_ENDPOINT",
                action: "CROSS_TENANT_ACCESS_ATTEMPT",
                message: `Intento de acceso cruzado: Entidad ${entityId} por Tenant ${tenantId}`,
                correlationId,
                details: { entityId, tenantId, resourceTenant: entity.tenantId }
            });
            throw new AppError('FORBIDDEN', 403, 'No tienes permiso para acceder a esta entidad');
        }

        // ----- 1️⃣ Load checklist configuration -----
        const config: ChecklistConfig = await getChecklistConfigById(config_id ?? "default", correlationId);

        // ----- 2️⃣ Check Persistence Layer -----
        const existingChecklist = await db.collection('extracted_checklists').findOne({
            entityId: entityId.toString()
        });

        let finalItems: ChecklistItem[] = [];

        if (existingChecklist && !refresh) {
            // Return existing items merged with current validations
            finalItems = existingChecklist.items.map((item: any) => {
                const validation = existingChecklist.validations?.[item.id];
                return { ...item, ...validation };
            });
        } else {
            // ----- 3️⃣ Retrieve relevant documents via vector search (top 15) -----
            const docs = await getRelevantDocuments(entityId, tenantId, { topK: 15, correlationId });

            // ----- 4️⃣ Extract checklist items using LLM mini‑prompt (top 5 docs) -----
            const checklistItemsRaw = await extractChecklist(docs.slice(0, 5), tenantId, correlationId);

            // ----- 5️⃣ Auto‑classify items -----
            const classifiedItems: ChecklistItem[] = checklistItemsRaw.map((item) => {
                const categoryId = autoClassify(item, config, correlationId);
                return { ...item, categoryId };
            });

            // ----- smart sort according to config priorities -----
            finalItems = smartSort(classifiedItems, config, correlationId);

            // ----- 6️⃣ Merge with existing validations if refreshing -----
            if (existingChecklist) {
                finalItems = finalItems.map(item => {
                    // Match by description hash to maintain validation on similar items
                    const existingValidation = Object.values(existingChecklist.validations || {}).find((v: any) => v.itemId === item.id);
                    if (existingValidation) return { ...item, ...existingValidation };
                    return item;
                });
            }

            // ----- 7️⃣ Save to Persistence Layer -----
            await db.collection('extracted_checklists').updateOne(
                { entityId: entityId.toString() },
                {
                    $set: {
                        items: finalItems,
                        updatedAt: new Date(),
                        tenantId
                    },
                    $setOnInsert: {
                        createdAt: new Date(),
                        validations: {}
                    }
                },
                { upsert: true }
            );
        }

        // ----- 6️⃣ Logging success -----
        const durationMs = Date.now() - start;
        await logEvento({
            level: "INFO",
            source: "CHECKLIST_ENDPOINT",
            action: "GET",
            message: `Returned ${finalItems.length} checklist items for entity ${entityId}`,
            correlationId,
            details: {
                durationMs,
                configName: config.name,
                refresh: !!refresh,
                fromCache: !refresh && !!existingChecklist
            }
        });

        // Regla #8: Performance Medible (SLA: 5000ms para este proceso pesado)
        if (durationMs > 5000) {
            await logEvento({
                level: "WARN",
                source: "CHECKLIST_ENDPOINT",
                action: "SLA_VIOLATION",
                message: `Checklist generado pero excedió SLA: ${durationMs}ms`,
                correlationId,
                details: { durationMs }
            });
        }

        return NextResponse.json({ success: true, items: finalItems }, { status: 200 });
    } catch (error) {
        // ----- Error handling & logging -----
        const durationMs = Date.now() - start;
        await logEvento({
            level: "ERROR",
            source: "CHECKLIST_ENDPOINT",
            action: "GET",
            message: "Failed to generate checklist",
            correlationId,
            details: { durationMs, error: (error as Error).message },
            stack: (error as Error).stack
        });

        if (error instanceof AppError) {
            return NextResponse.json({ error: error.message, code: error.name }, { status: error instanceof ValidationError ? 400 : 500 });
        }
        // Unexpected error – wrap in ExternalServiceError
        const wrapped = new ExternalServiceError("Unexpected error in checklist endpoint", error as Error);
        return NextResponse.json({ error: wrapped.message, code: wrapped.name }, { status: 500 });
    }
}

/**
 * PATCH /api/entities/[id]/checklist
 * Toggles a checklist item's completed status.
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const correlationId = uuidv4();

    try {
        const session = await auth();
        if (!session) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        const tenantId = session.user.tenantId;

        const { itemId, completed } = await request.json();
        if (!itemId) throw new ValidationError("Missing itemId");

        const db = await (await import("@/lib/db")).connectDB();

        // Actualizamos en la colección de entidades (Fase 82)
        const result = await db.collection('entities').updateOne(
            { _id: new (await import("mongodb")).ObjectId(id), tenantId },
            {
                $set: {
                    "metadata.checklist.$[item].completed": completed,
                    "metadata.checklist.$[item].completedBy": session.user.name,
                    "metadata.checklist.$[item].completedAt": new Date(),
                    updatedAt: new Date()
                }
            },
            {
                arrayFilters: [{ "item.id": itemId }]
            }
        );

        if (result.matchedCount === 0) {
            throw new NotFoundError(`Entidad o ítem de checklist no encontrado`);
        }

        await logEvento({
            level: "INFO",
            source: "CHECKLIST_ENDPOINT",
            action: "TOGGLE_ITEM",
            message: `Checklist item ${itemId} toggled to ${completed} for entity ${id}`,
            correlationId,
            details: { entityId: id, itemId, completed }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error, 'API_CHECKLIST_PATCH', correlationId);
    }
}
