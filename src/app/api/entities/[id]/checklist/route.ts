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
import { AppError, ValidationError, ExternalServiceError, DatabaseError, NotFoundError } from "@/lib/errors";
import { getRelevantDocuments } from "@/lib/rag-service";
import { getChecklistConfigById } from "@/lib/configs";

// ----- Input validation schema -----
const ParamsSchema = z.object({
    id: z.string(), // pedido ID
    config_id: z.string().optional()
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
        const tenantId = (session.user as any).tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        }

        // Parse query parameters
        const url = new URL(request.url);
        const rawConfigId = url.searchParams.get("config_id");
        const parsed = ParamsSchema.safeParse({ id, config_id: rawConfigId ?? undefined });
        if (!parsed.success) {
            throw new ValidationError("Invalid query parameters", parsed.error);
        }
        const { id: entityId, config_id } = parsed.data;

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

        // ----- 1️⃣ Retrieve relevant documents via vector search (top 15) -----
        const docs = await getRelevantDocuments(entityId, tenantId, { topK: 15, correlationId }); // returns [{id, content}]

        // ----- 2️⃣ Extract checklist items using LLM mini‑prompt (top 5 docs) -----
        const checklistItemsRaw = await extractChecklist(docs.slice(0, 5), tenantId, correlationId);


        // ----- 3️⃣ Load checklist configuration -----
        const config: ChecklistConfig = await getChecklistConfigById(config_id ?? "default", correlationId);

        // ----- 4️⃣ Auto‑classify items -----
        const classifiedItems: ChecklistItem[] = checklistItemsRaw.map((item) => {
            const categoryId = autoClassify(item, config, correlationId);
            return { ...item, categoryId };
        });

        // ----- smart sort according to config priorities -----
        const sortedItems = smartSort(classifiedItems, config, correlationId);

        // ----- 6️⃣ Logging success -----
        const durationMs = Date.now() - start;
        await logEvento({
            level: "INFO",
            source: "CHECKLIST_ENDPOINT",
            action: "GET",
            message: `Returned ${sortedItems.length} checklist items for entity ${entityId}`,
            correlationId,
            details: { durationMs, doc_count: docs.length, configName: config.name }
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

        return NextResponse.json({ success: true, items: sortedItems }, { status: 200 });
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
