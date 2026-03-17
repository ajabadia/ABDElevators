import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from '@/lib/auth';
import { extractChecklist } from "@/services/ingest/ChecklistExtractor";
import { autoClassify, smartSort } from '@/services/core/checklist-classifier';
import { ChecklistItem, ChecklistConfig, ItemValidation, Entity, TenantIdSchema } from "@/lib/schemas";
import { ValidationError, NotFoundError, handleApiError } from "@/lib/errors";
import { RagService } from "@/services/core/RagService";
import { getChecklistConfigById } from "@/lib/configs";
import { ObjectId } from "mongodb";
import { withCorrelation } from '@/lib/logger/with-correlation';
import { getTenantCollection } from '@/lib/db-tenant';
import { type SafeFilter } from '@/lib/repositories/BaseRepository';

const ParamsSchema = z.object({
    id: z.string().refine(val => ObjectId.isValid(val), "Invalid ObjectId"),
    config_id: z.string().optional(),
    refresh: z.preprocess((val) => val === 'true', z.boolean()).optional()
});

async function GET_internal(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return withCorrelation(
        { level: "INFO", source: "CHECKLIST_ENDPOINT", action: "GET_CHECKLIST" },
        async ({ log, correlationId }) => {
            const start = Date.now();
            try {
                const session = await requirePermission('technical:analysis', 'read');
                const tenantId = TenantIdSchema.parse(session.user.tenantId);
                const { id } = await context.params;

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

                const entitiesCollection = await getTenantCollection<Entity>('orders', session, 'MAIN');
                const entity = await entitiesCollection.findOne({ 
                    _id: new ObjectId(entityId) as any,
                    tenantId 
                } as SafeFilter<Entity>);

                if (!entity) throw new NotFoundError(`Entidad ${entityId} no encontrada`);

                const config: ChecklistConfig = await getChecklistConfigById(config_id ?? "default", session, correlationId);
                const checklistsCollection = await getTenantCollection('extracted_checklists', session, 'MAIN');
                const existingChecklist = await checklistsCollection.findOne({ entityId: entityId.toString(), tenantId } as any);

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

                    await checklistsCollection.updateOne(
                        { entityId: entityId.toString(), tenantId } as any,
                        {
                            $set: { items: finalItems, updatedAt: new Date() },
                            $setOnInsert: { createdAt: new Date(), validations: {} }
                        },
                        { upsert: true }
                    );
                }

                const durationMs = Date.now() - start;
                await log({
                    message: `Checklist for ${entityId}`,
                    details: { durationMs }
                });

                return NextResponse.json({ success: true, items: finalItems, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CHECKLIST_GET', correlationId);
            }
        }
    );
}

async function PATCH_internal(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return withCorrelation(
        { level: 'INFO', source: 'CHECKLIST_ENDPOINT', action: 'PATCH_CHECKLIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('technical:analysis', 'write');
                const tenantId = TenantIdSchema.parse(session.user.tenantId);
                const { id } = await context.params;

                if (!ObjectId.isValid(id)) throw new ValidationError("Invalid entity ID");

                const { itemId, completed } = await request.json();
                if (!itemId) throw new ValidationError("Missing itemId");

                const entitiesCollection = await getTenantCollection<Entity>('orders', session, 'MAIN');
                const result = await entitiesCollection.updateOne(
                    { _id: new ObjectId(id) as any, tenantId } as SafeFilter<Entity>,
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

                await log({
                    message: `Checklist item ${itemId} updated for ${id}`,
                    details: { completed }
                });

                return NextResponse.json({ success: true, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CHECKLIST_PATCH', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/technical/entities/[id]/checklist', thresholdMs: 1000 });
export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/technical/entities/[id]/checklist', thresholdMs: 1000 });
