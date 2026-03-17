import { NextRequest, NextResponse } from "next/server";
import { getTenantCollection } from "@/lib/db-tenant";
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError, ValidationError } from "@/lib/errors";
import { MongoAIWorkflowRepository } from "@/core/adapters/persistence/MongoAIWorkflowRepository";
import { withCorrelation } from '@/lib/logger/with-correlation';
import { AIWorkflowSchema, type AIWorkflow as AIWorkflowSchemaType, TenantIdSchema, EntityIdSchema } from "@/lib/schemas";
import { ObjectId } from "mongodb";
import { type SafeFilter } from "@/lib/repositories/BaseRepository";
import { z } from "zod";

const workflowRepository = new MongoAIWorkflowRepository();

/**
 * GET /api/core/automation/workflows
 * Lista los flujos de trabajo de IA activos.
 * SLA: P95 < 2000ms
 */
export const GET = withPerformanceSLA(async (req: NextRequest) => {
    return withCorrelation(
        { level: 'INFO', source: 'CORE_AUTOMATION', action: 'GET_WORKFLOWS' },
        async ({ log, correlationId }) => {
            try {
                const enforcedSession = await requirePermission('automation:workflow', 'read');
                const tenantId = TenantIdSchema.parse(enforcedSession.user.tenantId);

                const workflows = await workflowRepository.findActiveByTrigger('on_event', tenantId);

                return NextResponse.json({
                    success: true,
                    workflows,
                    correlationId
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CORE_AUTOMATION_WORKFLOWS_GET', correlationId);
            }
        }
    );
}, { endpoint: 'GET /api/core/automation/workflows', thresholdMs: 2000 });

/**
 * POST /api/core/automation/workflows
 * Crea o actualiza un flujo de trabajo de IA.
 * SLA: P95 < 2000ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest) => {
    return withCorrelation(
        { level: 'INFO', source: 'API_AUTOMATION', action: 'SAVE_WORKFLOW' },
        async ({ log, correlationId }) => {
            try {
                const enforcedSession = await requirePermission('automation:workflow', 'manage');
                const body = await req.json();
                
                // Rule #2: Zod Validation BEFORE Processing
                const tenantId = TenantIdSchema.parse(enforcedSession.user.tenantId);
                const validatedData = AIWorkflowSchema.parse({
                    ...body,
                    tenantId
                });

                const collection = await getTenantCollection<AIWorkflowSchemaType>('ai_workflows', enforcedSession, 'MAIN');

                let result;
                if (validatedData._id) {
                    const { _id, ...updateData } = validatedData;
                    result = await collection.updateOne(
                        { _id: new ObjectId(_id as any) as any, tenantId } as SafeFilter<AIWorkflowSchemaType>, 
                        { $set: { ...updateData, updatedAt: new Date() } }
                    );
                } else {
                    const workflowData = {
                        ...validatedData,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        active: true,
                        tenantId
                    };
                    result = await collection.insertOne(workflowData as AIWorkflowSchemaType);
                }

                await log({
                    message: `Workflow de IA guardado: ${validatedData.name}`,
                    details: { tenantId }
                });

                return NextResponse.json({
                    success: true,
                    result,
                    correlationId
                });
            } catch (error: unknown) {
                if (error instanceof z.ZodError) {
                    return handleApiError(new ValidationError('Workflow data invalid', error.issues), 'API_AUTOMATION', correlationId);
                }
                return handleApiError(error, 'API_CORE_AUTOMATION_WORKFLOWS_POST', correlationId);
            }
        }
    );
}, { endpoint: 'POST /api/core/automation/workflows', thresholdMs: 2000 });
