import crypto from 'crypto';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextResponse } from 'next/server';
import { UsageService } from '@/services/ops/usage-service';
import { handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';

/**
 * Endpoint para obtener métricas personales del usuario.
 * Fase 24.2: User View (Personal Insights)
 */
async function GET_internal () {
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

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/user/stats', thresholdMs: 500 });
