import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { enforcePermission } from '@/lib/guardian-guard';
import { extractChecklist } from "@/services/ingest/ChecklistExtractor";
import { autoClassify, smartSort } from '@/services/core/checklist-classifier';
import { ChecklistItem, ChecklistConfig, ItemValidation } from "@/lib/schemas";
import { logEvento } from "@/lib/logger";
import { AppError, ValidationError, NotFoundError, handleApiError } from "@/lib/errors";
import { RagService } from "@/services/core/RagService";
import { getChecklistConfigById } from "@/lib/configs";
import { ObjectId } from "mongodb";

const ParamsSchema = z.object({
    id: (await import('@/lib/schemas/common')).ObjectIdSchema,
    config_id: z.string().optional(),
    refresh: z.preprocess((val) => val === 'true', z.boolean()).optional()
});

async function GET_internal(request: NextRequest, context: { params: { id: string } }) {
    const correlationId = uuidv4();
    const start = Date.now();

    try {
        const session = await enforcePermission('technical:analysis', 'read');
        const tenantId = session.user.tenantId;
        const { id } = context.params;

        const url = new URL(request.url);
        const parsed = ParamsSchema.safeParse({
            id,
            config_id: url.searchParams.get("config_id") ?? undefined,
            refresh: url.searchParams.get("refresh") ?? undefined
        });
        if (!parsed.success) {
            throw new ValidationError("Invalid query parameters", parsed.error);
        }
        const { id: entityId, config_id, refresh } = parsed.data;

        const db = await (await import("@/lib/db")).connectDB();
        const entity = await db.collection('entities').findOne({ _id: new ObjectId(entityId), tenantId });

        if (!entity) throw new NotFoundError(`Entidad ${entityId} no encontrada`);

        const config: ChecklistConfig = await getChecklistConfigById(config_id ?? "default", session, correlationId);
        const existingChecklist = await db.collection('extracted_checklists').findOne({ entityId: entityId.toString(), tenantId });

        let finalItems: ChecklistItem[] = [];

        if (existingChecklist && !refresh) {
            finalItems = existingChecklist.items.map((item: ChecklistItem) => {
                const validation = (existingChecklist.validations as Record<string, ItemValidation> | undefined)?.[item.id];
                return { ...item, ...validation };
            });
        } else {
            const docs = await RagService.getRelevantDocuments(entityId, tenantId, correlationId, 15);
            const checklistItemsRaw: Partial<ChecklistItem>[] = await extractChecklist(docs.slice(0, 5), tenantId, correlationId);
            const classifiedItems: ChecklistItem[] = checklistItemsRaw.map((item) => {
                const categoryId = autoClassify(item as ChecklistItem, config, correlationId);
                return { ...item, categoryId } as ChecklistItem;
            });
            finalItems = smartSort(classifiedItems, config, correlationId);

            if (existingChecklist) {
                finalItems = finalItems.map(item => {
                    const existingValidation = Object.values(existingChecklist.validations || {}).find((v: any) => v.itemId === item.id);
                    if (existingValidation) return { ...item, ...existingValidation as any };
                    return item;
                });
            }

            await db.collection('extracted_checklists').updateOne(
                { entityId: entityId.toString(), tenantId },
                {
                    $set: { items: finalItems, updatedAt: new Date() },
                    $setOnInsert: { createdAt: new Date(), validations: {} }
                },
                { upsert: true }
            );
        }

        const durationMs = Date.now() - start;
        await logEvento({
            level: "INFO",
            source: "CHECKLIST_ENDPOINT",
            action: "GET",
            message: `Checklist for ${entityId}`,
            correlationId,
            details: { durationMs }
        });

        return NextResponse.json({ success: true, items: finalItems });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CHECKLIST_GET', correlationId);
    }
}

async function PATCH_internal(request: NextRequest, context: { params: { id: string } }) {
    const correlationId = uuidv4();
    try {
        const session = await enforcePermission('technical:analysis', 'write');
        const tenantId = session.user.tenantId;
        const { id } = context.params;

        // 🛡️ SECURITY: Validate format before ObjectId constructor
        const { ObjectIdSchema } = await import('@/lib/schemas/common');
        ObjectIdSchema.parse(id);

        const { itemId, completed } = await request.json();
        if (!itemId) throw new ValidationError("Missing itemId");

        const db = await (await import("@/lib/db")).connectDB();
        const result = await db.collection('entities').updateOne(
            { _id: new ObjectId(id), tenantId },
            {
                $set: {
                    "metadata.checklist.$[item].completed": completed,
                    "metadata.checklist.$[item].completedBy": session.user?.name || 'System',
                    "metadata.checklist.$[item].completedAt": new Date(),
                    updatedAt: new Date()
                }
            },
            { arrayFilters: [{ "item.id": itemId }] }
        );

        if (result.matchedCount === 0) throw new NotFoundError(`Entidad o ítem de checklist no encontrado`);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CHECKLIST_PATCH', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/technical/entities/[id]/checklist', thresholdMs: 1000 });

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/technical/entities/[id]/checklist', thresholdMs: 1000 });
