import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { PromptService } from '@/services/llm/prompt-service';
import { AppError, handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/prompts/[id]/versions
 * Obtiene el historial de versiones de un prompt (Phase 70 compliance)
 */
async function GET_internal (
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('prompt', 'read');
        const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
        const tenantId = session.user.tenantId;

        const versions = await PromptService.getVersionHistory(id, isSuperAdmin ? undefined : tenantId);

        return NextResponse.json({ success: true, versions });
    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_PROMPTS_VERSIONS_GET', correlationId);
    }
}

/**
 * POST /api/admin/prompts/[id]/versions
 * Rollback a una versión específica (Phase 70 compliance)
 */
async function POST_internal (
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('prompt', 'manage');

        const { targetVersion } = await req.json();

        if (!targetVersion) {
            throw new AppError('VALIDATION_ERROR', 400, 'targetVersion es requerido');
        }

        await PromptService.rollbackToVersion(
            id,
            targetVersion,
            session.user.email!
        );

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_PROMPTS_ROLLBACK', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/prompts/[id]/versions', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/prompts/[id]/versions', thresholdMs: 1000 });
