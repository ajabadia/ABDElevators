import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PromptService } from '@/lib/prompt-service';
import { AppError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/prompts/history
 * Obtiene el historial global de cambios en prompts
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'No autorizado');
        }

        const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
        const tenantId = (session.user as any).tenantId || 'default_tenant';

        const history = await PromptService.getGlobalHistory(isSuperAdmin ? null : tenantId);

        return NextResponse.json({ success: true, history });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PROMPTS_HISTORY', correlacion_id);
    }
}
