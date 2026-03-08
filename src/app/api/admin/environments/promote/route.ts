import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { EnvironmentService } from '@/services/core/environment-service';
import { AppError, handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';

/**
 * POST /api/admin/environments/promote
 * Promueve una entidad de STAGING a PRODUCTION (Phase 70 compliance)
 */
async function POST_internal (req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('environment', 'manage');
        const tenantId = session.user.tenantId;

        const body = await req.json();
        const { type, id } = body;

        if (!type || !id) {
            throw new AppError('VALIDATION_ERROR', 400, 'Tipo e ID de entidad requeridos');
        }

        const changedBy = session.user.email || 'system';

        if (type === 'PROMPT') {
            await EnvironmentService.promotePromptToProduction(id, tenantId, correlationId, changedBy);
        } else if (type === 'WORKFLOW') {
            await EnvironmentService.promoteWorkflowToProduction(id, tenantId, correlationId, changedBy);
        } else {
            throw new AppError('VALIDATION_ERROR', 400, `Tipo de promoción '${type}' no soportado`);
        }

        return NextResponse.json({ success: true, message: 'Entidad promovida correctamente' });
    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_ENV_PROMOTE', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/environments/promote', thresholdMs: 1000 });
