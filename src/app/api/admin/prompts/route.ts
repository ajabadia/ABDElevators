import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { PromptService } from '@/lib/prompt-service';
import { PromptSchema } from '@/lib/schemas';
import { handleApiError, AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/prompts
 * Lista todos los prompts del tenant (Phase 70 compliance)
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
        const tenantId = session.user.tenantId;

        const { searchParams } = new URL(req.url);
        const environment = searchParams.get('environment') || 'PRODUCTION';

        // Si es SUPER_ADMIN, listamos TODO. Si no, solo su tenant.
        const prompts = await PromptService.listPrompts(isSuperAdmin ? null : tenantId, false, environment);

        // Enriquecer con info del tenant (solo si es SuperAdmin)
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
 * Crea un nuevo prompt (Phase 70 compliance)
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const tenantId = session.user.tenantId;

        const body = await req.json();

        // 🛡️ SECURITY: Prevent Parameter Pollution
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
            version: 1,
            createdBy: session.user.email || undefined,
            updatedBy: session.user.email || undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            environment: body.environment || 'PRODUCTION'
        };

        const validated = PromptSchema.parse(promptData);

        const { getTenantCollection } = await import('@/lib/db-tenant');
        const collection = await getTenantCollection<any>('prompts');

        // Check duplication by key AND environment
        const existing = await collection.findOne({
            key: validated.key,
            tenantId,
            environment: validated.environment
        });
        if (existing) {
            throw new AppError('CONFLICT', 409, `Prompt key '${validated.key}' already exists in ${validated.environment}`);
        }

        await collection.insertOne(validated);

        await logEvento({
            level: 'INFO',
            source: 'API_PROMPTS',
            action: 'CREATE_PROMPT',
            message: `Nuevo prompt creado: ${validated.key}`,
            correlationId: correlacion_id,
            details: { promptKey: validated.key, category: validated.category },
            userEmail: session.user.email || undefined
        });

        return NextResponse.json({ success: true, prompt: validated });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PROMPTS_POST', correlacion_id);
    }
}
