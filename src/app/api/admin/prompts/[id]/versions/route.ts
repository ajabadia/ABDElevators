import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PromptService } from '@/lib/prompt-service';
import { AppError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/prompts/[id]/versions
 * Obtiene el historial de versiones de un prompt
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const isSuperAdmin = session.user?.role === 'SUPER_ADMIN';
        const tenantId = (session.user as any).tenantId || 'default_tenant';
        const versions = await PromptService.getVersionHistory(id, isSuperAdmin ? undefined : tenantId);

        return NextResponse.json({ success: true, versions });
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, error.message).toJSON(),
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/prompts/[id]/versions
 * Rollback a una versión específica
 */
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const isSuperAdmin = session.user?.role === 'SUPER_ADMIN';
        const tenantId = (session.user as any).tenantId || 'default_tenant';
        const { targetVersion } = await req.json();

        if (!targetVersion) {
            throw new AppError('VALIDATION_ERROR', 400, 'targetVersion es requerido');
        }

        await PromptService.rollbackToVersion(
            id,
            targetVersion,
            session.user.email!,
            isSuperAdmin ? undefined : tenantId
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, error.message).toJSON(),
            { status: 500 }
        );
    }
}
