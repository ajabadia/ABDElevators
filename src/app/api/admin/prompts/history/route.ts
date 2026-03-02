import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { PromptService } from '@/services/llm/prompt-service';
import { handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/prompts/history
 * Obtiene el historial global de cambios en prompts (Phase 70 compliance)
 */
async function GET_internal (req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await enforcePermission('prompt', 'read');
        const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
        const tenantId = session.user.tenantId;

        const history = await PromptService.getGlobalHistory(isSuperAdmin ? null : tenantId);

        return NextResponse.json({ success: true, history });
    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_PROMPTS_HISTORY', correlacion_id);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/prompts/history', thresholdMs: 1000 });
