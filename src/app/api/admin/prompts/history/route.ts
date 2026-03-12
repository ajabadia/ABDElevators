import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { PromptService } from '@/services/llm/prompt-service';
import { handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/prompts/history
 * Retrieves global history of prompt changes (Phase 70 compliance)
 */
async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('prompt', 'read');
        const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
        const tenantId = session.user.tenantId;

        const history = await PromptService.getGlobalHistory(isSuperAdmin ? null : tenantId);

        return NextResponse.json({ success: true, history });
    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_PROMPTS_HISTORY', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/prompts/history', thresholdMs: 1000 });
