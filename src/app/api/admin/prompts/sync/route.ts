import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { PromptService } from '@/lib/prompt-service';
import { handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

/**
 * POST /api/admin/prompts/sync
 * Sincroniza los prompts desde el código (lib/prompts.ts) hacia la base de datos.
 * Aplica lógica de versionado: solo actualiza si la versión en código es mayor.
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        // 1. Validar permisos (Solo Admin o SuperAdmin)
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const tenantId = session.user.tenantId;

        // 2. Ejecutar la sincronización
        // syncFallbacks ya implementa la lógica de:
        // - Crear si no existe
        // - Actualizar si master.version > existing.version
        const results = await PromptService.syncFallbacks(tenantId);

        // 3. Loguear el evento
        await logEvento({
            level: 'INFO',
            source: 'API_ADMIN_PROMPTS',
            action: 'SYNC_PROMPTS',
            message: `Sincronización de prompts ejecutada manualmente desde UI.`,
            correlationId: correlacion_id,
            details: {
                created: results.created,
                updated: results.updated,
                errors: results.errors,
                tenantId
            },
            userEmail: session.user.email || 'system'
        });

        return NextResponse.json({
            success: true,
            message: 'Sincronización finalizada exitosamente',
            results
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PROMPTS_SYNC', correlacion_id);
    }
}
