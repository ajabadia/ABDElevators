import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PromptService } from '@/lib/prompt-service';
import { AppError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * PATCH /api/admin/prompts/[id]
 * Actualiza un prompt específico.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = crypto.randomUUID();
    const { id } = await params;

    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'No autorizado para gestionar prompts');
        }

        const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
        const tenantId = (session.user as any).tenantId || 'default_tenant';
        const body = await request.json();
        const { template, variables, changeReason } = body;

        if (!template || !changeReason) {
            throw new AppError('VALIDATION_ERROR', 400, 'template y changeReason son requeridos');
        }

        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        await PromptService.updatePrompt(
            id,
            template,
            variables || [],
            session.user.email!,
            changeReason,
            isSuperAdmin ? undefined : tenantId,
            { correlacion_id, ip, userAgent }
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PROMPT_UPDATE', correlacion_id);
    }
}
