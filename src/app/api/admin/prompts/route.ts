import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PromptService } from '@/lib/prompt-service';
import { PromptSchema } from '@/lib/schemas';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/admin/prompts
 * Lista todos los prompts del tenant
 */
export async function GET(req: NextRequest) {
    const correlacion_id = uuidv4();
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Solo administradores pueden gestionar prompts');
        }

        const tenantId = (session.user as any).tenantId || 'default_tenant';
        const prompts = await PromptService.listPrompts(tenantId);

        await logEvento({
            nivel: 'INFO',
            origen: 'API_PROMPTS',
            accion: 'LIST_PROMPTS',
            mensaje: `Admin listó ${prompts.length} prompts`,
            correlacion_id,
            detalles: { count: prompts.length }
        });

        return NextResponse.json({ success: true, prompts });
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
 * POST /api/admin/prompts
 * Crea un nuevo prompt
 */
export async function POST(req: NextRequest) {
    const correlacion_id = uuidv4();
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Solo administradores pueden crear prompts');
        }

        const tenantId = (session.user as any).tenantId || 'default_tenant';
        const body = await req.json();

        const promptData = {
            ...body,
            tenantId,
            createdBy: session.user.email,
            updatedBy: session.user.email
        };

        const validated = PromptSchema.parse(promptData);

        const { getTenantCollection } = await import('@/lib/db-tenant');
        const { collection } = await getTenantCollection('prompts');
        await collection.insertOne(validated);

        await logEvento({
            nivel: 'INFO',
            origen: 'API_PROMPTS',
            accion: 'CREATE_PROMPT',
            mensaje: `Nuevo prompt creado: ${validated.key}`,
            correlacion_id,
            detalles: { promptKey: validated.key, category: validated.category }
        });

        return NextResponse.json({ success: true, prompt: validated });
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
 * PUT /api/admin/prompts
 * Actualiza un prompt (crea nueva versión)
 */
export async function PUT(req: NextRequest) {
    const correlacion_id = uuidv4();
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Solo administradores pueden actualizar prompts');
        }

        const tenantId = (session.user as any).tenantId || 'default_tenant';
        const { promptId, template, variables, changeReason } = await req.json();

        if (!promptId || !template || !changeReason) {
            throw new AppError('VALIDATION_ERROR', 400, 'promptId, template y changeReason son requeridos');
        }

        await PromptService.updatePrompt(
            promptId,
            template,
            variables || [],
            session.user.email!,
            changeReason,
            tenantId
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
