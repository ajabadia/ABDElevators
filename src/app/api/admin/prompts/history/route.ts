import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { PromptService } from '@/lib/prompt-service';
import { handleApiError } from '@/lib/errors';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/prompts/history
 * Obtiene el historial global de cambios en prompts (Phase 70 compliance)
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
        const tenantId = session.user.tenantId;

        const history = await PromptService.getGlobalHistory(isSuperAdmin ? null : tenantId);

        return NextResponse.json({ success: true, history });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PROMPTS_HISTORY', correlacion_id);
    }
}
