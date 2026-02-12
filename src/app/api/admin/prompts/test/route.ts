import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { PromptTesterService, PromptTestSchema } from '@/services/prompt-tester-service';
import { handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import crypto from 'crypto';

/**
 * POST /api/admin/prompts/test
 * Ejecuta una simulación de prompt (Dry-run) sin efectos secundarios.
 * Phase 83 compliance.
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const tenantId = session.user.tenantId;

        const body = await req.json();

        // Validar entrada con Zod
        const validatedInput = PromptTestSchema.parse({
            ...body,
            tenantId,
            correlationId: correlacion_id
        });

        // Ejecutar simulación o comparativa
        if (body.compare) {
            const result = await PromptTesterService.runComparison(validatedInput);
            return NextResponse.json({
                success: true,
                comparison: result,
                correlationId: correlacion_id
            });
        }

        const result = await PromptTesterService.runSimulation(validatedInput);

        return NextResponse.json({
            success: true,
            result,
            correlationId: correlacion_id
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PROMPTS_TEST', correlacion_id);
    }
}
