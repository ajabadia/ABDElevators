import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { ChecklistConfigSchema } from '@/lib/schemas';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { checklistConfigRepository } from '@/lib/repositories/ChecklistConfigRepository';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/checklist-configs
 * Lista todas las configuraciones de checklist del tenant.
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_CHECKLIST_CONFIGS', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('checklists', 'read');
                const configs = await checklistConfigRepository.list({}, { sort: { creado: -1 } }, session as any);

                await log({
                    message: `Retrieved ${configs.length} checklist configurations`,
                    details: { count: configs.length, tenantId: session.user.tenantId }
                });

                return NextResponse.json({ success: true, configs });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CHECKLIST_CONFIGS_GET', correlationId);
            }
        }
    );
}

/**
 * POST /api/admin/checklist-configs
 * Crea una nueva configuración de checklist.
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_CHECKLIST_CONFIGS', action: 'CREATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('checklists', 'write');
                const body = await req.json();

                // Inyectar metadatos
                const configToValidate = {
                    ...body,
                    tenantId: session.user.tenantId,
                    creado: new Date(),
                    actualizado: new Date()
                };

                const validated = ChecklistConfigSchema.parse(configToValidate);

                const { id: _id_orig, ...insertData } = validated;
                const resultId = await checklistConfigRepository.create(insertData as any, session as any);

                await log({
                    message: `Checklist config created: ${validated.name}`,
                    details: { tenantId: session.user.tenantId, config_id: resultId, createdBy: session.user.email }
                });

                return NextResponse.json({ success: true, config_id: resultId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CHECKLIST_CONFIGS_POST', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/checklist-configs', thresholdMs: 500 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/checklist-configs', thresholdMs: 1000 });
