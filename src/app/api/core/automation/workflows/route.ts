import { NextRequest, NextResponse } from "next/server";
import { getTenantCollection } from "@/lib/db-tenant";
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError } from "@/lib/errors";
import { MongoAIWorkflowRepository } from "@/core/adapters/persistence/MongoAIWorkflowRepository";
import { withCorrelation } from '@/lib/logger/with-correlation';

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
                const tenantId = enforcedSession.user.tenantId;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const workflows = await workflowRepository.findActiveByTrigger('on_event' as any, tenantId);

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
                const collection = await getTenantCollection('ai_workflows', enforcedSession as unknown as Parameters<typeof getTenantCollection>[1]);

                let result;
                if (body._id) {
                    const { _id, ...updateData } = body;
                    result = await collection.updateOne({ _id: _id } as Record<string, unknown>, { $set: updateData });
                } else {
                    const workflowData = {
                        ...body,
                        createdAt: new Date(),
                        active: true,
                        tenantId: enforcedSession.user.tenantId
                    };
                    result = await collection.insertOne(workflowData);
                }

                await log({
                    message: `Workflow de IA guardado: ${body.name}`,
                    details: { tenantId: enforcedSession.user.tenantId }
                });

                return NextResponse.json({
                    success: true,
                    result,
                    correlationId
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CORE_AUTOMATION_WORKFLOWS_POST', correlationId);
            }
        }
    );
}, { endpoint: 'POST /api/core/automation/workflows', thresholdMs: 2000 });
