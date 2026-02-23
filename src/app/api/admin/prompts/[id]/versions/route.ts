import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { PromptService } from '@/lib/prompt-service';
import { AppError, handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/prompts/[id]/versions
 * Obtiene el historial de versiones de un prompt (Phase 70 compliance)
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
        const tenantId = session.user.tenantId;

        const versions = await PromptService.getVersionHistory(id, isSuperAdmin ? undefined : tenantId);

        return NextResponse.json({ success: true, versions });
    } catch (error: any) {
        return handleApiError(error, 'API_ADMIN_PROMPTS_VERSIONS_GET', correlacion_id);
    }
}

/**
 * POST /api/admin/prompts/[id]/versions
 * Rollback a una versión específica (Phase 70 compliance)
 */
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const correlacion_id = crypto.randomUUID();
    try {
        // Double defense: Role check + Guardian Permission check
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

        // FASE 58 & 70: Enforce Guardian V2 ABAC
        await enforcePermission('developer-tools:prompts', 'manage');

        const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
        const tenantId = session.user.tenantId;

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
    } catch (error: any) {
        return handleApiError(error, 'API_ADMIN_PROMPTS_ROLLBACK', correlacion_id);
    }
}
