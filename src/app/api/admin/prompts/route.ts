import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PromptService } from '@/lib/prompt-service';
import { PromptSchema } from '@/lib/schemas';
import { AppError, handleApiError } from '@/lib/errors';
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
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'Solo administradores pueden gestionar prompts');
        }

        const tenantId = (session.user as any).tenantId || 'default_tenant';
        const prompts = await PromptService.listPrompts(tenantId);

        return NextResponse.json({ success: true, prompts });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PROMPTS_GET', correlacion_id);
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
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'Solo administradores pueden crear prompts');
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
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PROMPTS_POST', correlacion_id);
    }
}
