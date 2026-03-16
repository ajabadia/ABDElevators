import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { PromptService } from '@/services/llm/prompt-service';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/admin/prompts/sync
 * Administrative endpoint to synchronize hardcoded fallback prompts with the DB.
 */
async function POST_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_PROMPT_SYNC', action: 'SYNC_FALLBACKS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('prompt', 'manage');
                const tenantId = session.user.tenantId || 'abd_global';

                await log({
                    message: `Manual prompt sync initiated by ${session.user.email}`,
                    details: { tenantId }
                });

                const result = await PromptService.syncFallbacks(tenantId);

                await log({
                    message: `Manual prompt sync completed. Created: ${result.created}, Updated: ${result.updated}`,
                    details: { tenantId, stats: result }
                });

                return NextResponse.json({
                    success: true,
                    results: result, // Alias for backward compatibility
                    stats: result,
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'ADMIN_PROMPT_SYNC_API', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/prompts/sync', thresholdMs: 2000 });
