import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PromptService } from '@/services/llm/prompt-service';
import { logEvento } from '@/lib/logger';
import { AppError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * POST /api/admin/prompts/sync
 * Administrative endpoint to synchronize hardcoded fallback prompts with the DB.
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();

        // Estricta validación de rol ADMIN
        if (!session?.user || session.user.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado para realizar sincronización');
        }

        const tenantId = session.user.tenantId || 'abd_global';

        await logEvento({
            level: 'INFO',
            source: 'ADMIN_PROMPT_SYNC_API',
            action: 'SYNC_START',
            message: `Manual prompt sync initiated by ${session.user.email}`,
            tenantId,
            correlationId
        });

        const result = await PromptService.syncFallbacks(tenantId);

        await logEvento({
            level: 'INFO',
            source: 'ADMIN_PROMPT_SYNC_API',
            action: 'SYNC_COMPLETE',
            message: `Manual prompt sync completed. Created: ${result.created}, Updated: ${result.updated}`,
            tenantId,
            correlationId,
            details: result
        });

        return NextResponse.json({
            success: true,
            results: result, // Alias for backward compatibility
            stats: result,
            correlationId
        });

    } catch (error: any) {
        return handleApiError(error, 'ADMIN_PROMPT_SYNC_API', correlationId);
    } finally {
        const durationMs = Date.now() - start;
        if (durationMs > 2000) {
            await logEvento({
                level: 'WARN',
                source: 'ADMIN_PROMPT_SYNC_API',
                action: 'PERFORMANCE_ISSUE',
                message: `Slow prompt sync: ${durationMs}ms`,
                correlationId,
                details: { durationMs }
            });
        }
    }
}
