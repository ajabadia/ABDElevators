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
        const tenantId = (session.user as any).tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        }

        // Si es SUPER_ADMIN, listamos TODO. Si no, solo su tenant.
        // False = incluir inactivos (para que los admins puedan verlos y reactivarlos)
        const prompts = await PromptService.listPrompts(isSuperAdmin ? null : tenantId, false);

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
        // Allow ADMIN or SUPER_ADMIN
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'Solo administradores pueden crear prompts');
        }

        const tenantId = (session.user as any).tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        }

        const body = await req.json();

        // 🛡️ SECURITY: Prevent Parameter Pollution
        // Explicitly pick allowed fields to avoid prototype pollution or overriding protected fields like tenantId
        const promptData = {
            key: body.key,
            name: body.name,
            description: body.description,
            category: body.category,
            model: body.model,
            template: body.template,
            variables: body.variables || [],
            active: body.active ?? true,
            maxLength: body.maxLength,

            // Protected/System fields
            tenantId,
            version: 1, // Start at version 1
            createdBy: session.user.email || undefined,
            updatedBy: session.user.email || undefined,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const validated = PromptSchema.parse(promptData);

        const { getTenantCollection } = await import('@/lib/db-tenant');
        const collection = await getTenantCollection<any>('prompts');

        // Check duplication by key
        const existing = await collection.findOne({ key: validated.key, tenantId });
        if (existing) {
            throw new AppError('CONFLICT', 409, `Prompt key '${validated.key}' already exists`);
        }

        await collection.insertOne(validated);

        await logEvento({
            level: 'INFO',
            source: 'API_PROMPTS',
            action: 'CREATE_PROMPT',
            message: `Nuevo prompt creado: ${validated.key}`,
            correlationId: correlacion_id,
            details: { promptKey: validated.key, category: validated.category },
            userEmail: session.user.email || undefined // Auto-hashed by logger now
        });

        return NextResponse.json({ success: true, prompt: validated });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PROMPTS_POST', correlacion_id);
    }
}
