// app/api/pedidos/[id]/checklist/route.ts
// Checklist endpoint for Phase 6 – returns dynamic checklist items for a given order.
// Implements strict TypeScript, Zod validation, AppError handling, structured logging, and performance measurement.

import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";

import { extractChecklist } from "@/lib/checklist-extractor";
import { autoClassify, smartSort } from "@/lib/checklist-auto-classifier";
import { ChecklistItem, ChecklistConfig, Pedido } from "@/lib/schemas";
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

    const correlacion_id = uuidv4();
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
        const { id: pedidoId, config_id } = parsed.data;

        // 🛡️ Tenant Isolation Check
        const db = await (await import("@/lib/db")).connectDB();
        const pedido = await db.collection('pedidos').findOne({
            _id: new (await import("mongodb")).ObjectId(pedidoId)
        });

        if (!pedido) {
            throw new NotFoundError(`Pedido ${pedidoId} no encontrado`);
        }

        if (pedido.tenantId && pedido.tenantId !== tenantId) {
            await logEvento({
                nivel: "WARN",
                origen: "CHECKLIST_ENDPOINT",
                accion: "CROSS_TENANT_ACCESS_ATTEMPT",
                mensaje: `Intento de acceso cruzado: Pedido ${pedidoId} por Tenant ${tenantId}`,
                correlacion_id,
                detalles: { pedidoId, tenantId, resourceTenant: pedido.tenantId }
            });
            throw new AppError('FORBIDDEN', 403, 'No tienes permiso para acceder a este pedido');
        }

        // ----- 1️⃣ Retrieve relevant documents via vector search (top 15) -----
        const docs = await getRelevantDocuments(pedidoId, tenantId, { topK: 15, correlacion_id }); // returns [{id, content}]

        // ----- 2️⃣ Extract checklist items using LLM mini‑prompt (top 5 docs) -----
        const checklistItemsRaw = await extractChecklist(docs.slice(0, 5), tenantId, correlacion_id);


        // ----- 3️⃣ Load checklist configuration -----
        const config: ChecklistConfig = await getChecklistConfigById(config_id ?? "default", correlacion_id);

        // ----- 4️⃣ Auto‑classify items -----
        const classifiedItems: ChecklistItem[] = checklistItemsRaw.map((item) => {
            const categoryId = autoClassify(item, config, correlacion_id);
            return { ...item, categoryId };
        });

        // ----- 5️⃣ Smart sort according to config priorities -----
        const sortedItems = smartSort(classifiedItems, config, correlacion_id);

        // ----- 6️⃣ Logging success -----
        const durationMs = Date.now() - start;
        await logEvento({
            nivel: "INFO",
            origen: "CHECKLIST_ENDPOINT",
            accion: "GET",
            mensaje: `Returned ${sortedItems.length} checklist items for pedido ${pedidoId}`,
            correlacion_id,
            detalles: { duration_ms: durationMs, doc_count: docs.length, config_id: config.nombre }
        });

        // Regla #8: Performance Medible (SLA: 5000ms para este proceso pesado)
        if (durationMs > 5000) {
            await logEvento({
                nivel: "WARN",
                origen: "CHECKLIST_ENDPOINT",
                accion: "SLA_VIOLATION",
                mensaje: `Checklist generado pero excedió SLA: ${durationMs}ms`,
                correlacion_id,
                detalles: { duration_ms: durationMs }
            });
        }

        return NextResponse.json({ success: true, items: sortedItems }, { status: 200 });
    } catch (error) {
        // ----- Error handling & logging -----
        const durationMs = Date.now() - start;
        await logEvento({
            nivel: "ERROR",
            origen: "CHECKLIST_ENDPOINT",
            accion: "GET",
            mensaje: "Failed to generate checklist",
            correlacion_id,
            detalles: { duration_ms: durationMs, error: (error as Error).message },
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
