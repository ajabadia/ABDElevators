import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { logEvento } from '@/lib/logger';
import { ChecklistConfigSchema } from '@/lib/schemas';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { checklistConfigRepository } from '@/lib/repositories/ChecklistConfigRepository';
import crypto from 'crypto';

/**
 * GET /api/admin/checklist-configs
 * Lista todas las configuraciones de checklist del tenant.
 */
export const GET = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('checklists', 'read');
        const configs = await checklistConfigRepository.list({}, { sort: { creado: -1 } }, session as any);

        return NextResponse.json({ configs });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CHECKLIST_CONFIGS_GET', correlationId);
    }
}, { endpoint: 'API_CHECKLIST_CONFIGS_GET', thresholdMs: 500 });

/**
 * POST /api/admin/checklist-configs
 * Crea una nueva configuración de checklist.
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('checklists', 'write');
        const body = await req.json();

        // Inyectar metadatos
        const configToValidate = {
            ...body,
            tenantId: session.user.tenantId,
            creado: new Date(),
            actualizado: new Date()
        };

        const validated = ChecklistConfigSchema.parse(configToValidate);

        // Remove id string if it conflicts or handle it
        const { id: _id_orig, ...insertData } = validated;
        const resultId = await checklistConfigRepository.create(insertData as any, session as any);

        await logEvento({
            level: 'INFO',
            source: 'API_CHECKLIST_CONFIGS',
            action: 'CREATE',
            message: `Checklist config created: ${validated.name}`,
            correlationId,
            details: { tenantId: session.user.tenantId, config_id: resultId }
        });

        return NextResponse.json({ success: true, config_id: resultId });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CHECKLIST_CONFIGS_POST', correlationId);
    }
}
