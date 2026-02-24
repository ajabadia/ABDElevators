import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { EnvironmentService } from '@/services/core/environment-service';
import { AppError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

/**
 * POST /api/admin/environments/promote
 * Promueve una entidad de STAGING a PRODUCTION (Phase 70 compliance)
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const tenantId = session.user.tenantId;

        const body = await req.json();
        const { type, id } = body;

        if (!type || !id) {
            throw new AppError('VALIDATION_ERROR', 400, 'Tipo e ID de entidad requeridos');
        }

        const changedBy = session.user.email || 'system';

        if (type === 'PROMPT') {
            await EnvironmentService.promotePromptToProduction(id, tenantId, correlacion_id, changedBy);
        } else if (type === 'WORKFLOW') {
            await EnvironmentService.promoteWorkflowToProduction(id, tenantId, correlacion_id, changedBy);
        } else {
            throw new AppError('VALIDATION_ERROR', 400, `Tipo de promoción '${type}' no soportado`);
        }

        return NextResponse.json({ success: true, message: 'Entidad promovida correctamente' });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_ENV_PROMOTE', correlacion_id);
    }
}
