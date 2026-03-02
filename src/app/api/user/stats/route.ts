import { NextResponse } from 'next/server';
import { UsageService } from '@/services/ops/usage-service';
import { handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import crypto from 'crypto';

/**
 * Endpoint para obtener métricas personales del usuario.
 * Fase 24.2: User View (Personal Insights)
 */
export async function GET() {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('user:profile', 'read');

        const stats = await UsageService.getUserMetrics(session.user.id, session.user.tenantId);

        return NextResponse.json({
            success: true,
            stats
        });

    } catch (error) {
        return handleApiError(error, 'API_USER_STATS', correlationId);
    }
}
