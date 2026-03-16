import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { PromptService } from '@/services/llm/prompt-service';
import { handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/prompts/history
 * Retrieves global history of prompt changes (Phase 70 compliance)
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_PROMPT_HISTORY', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('prompt', 'read');
                const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
                const tenantId = session.user.tenantId;

                const history = await PromptService.getGlobalHistory(isSuperAdmin ? null : tenantId);

                await log({
                    message: `Retrieved prompt history (${history.length} items)`,
                    details: { count: history.length }
                });

                return NextResponse.json({ success: true, history });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_PROMPTS_HISTORY', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/prompts/history', thresholdMs: 1000 });
