import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { PromptService } from '@/lib/prompt-service';
import { AppError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

/**
 * PATCH /api/admin/prompts/[id]
 * Actualiza un prompt específico (Phase 70 compliance).
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    const { id } = await params;

    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
        const tenantId = session.user.tenantId;

        const body = await request.json();
        const { template, variables, changeReason } = body;

        if (!template || !changeReason) {
            throw new AppError('VALIDATION_ERROR', 400, 'template y changeReason son requeridos');
        }

        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        await PromptService.updatePrompt(
            id,
            { template, variables: variables || [], category: body.category, model: body.model, industry: body.industry },
            session.user.email!,
            changeReason,
            isSuperAdmin ? undefined : tenantId,
            { correlationId, ip, userAgent }
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PROMPT_UPDATE', correlationId);
    }
}
