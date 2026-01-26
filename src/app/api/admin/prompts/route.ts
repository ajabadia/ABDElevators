import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PromptService } from '@/lib/prompt-service';
import { PromptSchema } from '@/lib/schemas';
import { AppError, handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * GET /api/admin/prompts
 * Lista todos los prompts del tenant
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'Solo administradores pueden gestionar prompts');
        }

        const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
        const tenantId = (session.user as any).tenantId || 'default_tenant';

        // Si es SUPER_ADMIN, listamos TODO. Si no, solo su tenant.
        const prompts = await PromptService.listPrompts(isSuperAdmin ? null : tenantId);

        // Enriquecer con info del tenant (solo si es SuperAdmin para que sepa de quién es cada uno)
        if (isSuperAdmin) {
            const { TenantService } = await import('@/lib/tenant-service');
            const tenants = await TenantService.getAllTenants();
            const tenantMap = new Map(tenants.map(t => [t.tenantId, t]));

            const enrichedPrompts = prompts.map(p => ({
                ...p,
                tenantInfo: tenantMap.get(p.tenantId) || {
                    name: p.tenantId === 'platform_master' ? 'Platform Master' : 'Unknown Tenant',
                    branding: { logo: { url: null } }
                }
            }));

            return NextResponse.json({ success: true, prompts: enrichedPrompts });
        }

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
    const correlacion_id = crypto.randomUUID();
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
