import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { TechnicalStatsService } from '@/services/core/TechnicalStatsService';
import { handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

/**
 * GET /api/technical/stats
 * Provides technical KPIs for the infrastructure dashboard.
 * SLA: P95 < 300ms
 */
export const GET = withPerformanceSLA(async (req) => {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('technical:stats', 'read');

        const stats = await TechnicalStatsService.getTechnicalKPIs(session.user.tenantId);

        return NextResponse.json({
            success: true,
            stats,
            correlationId
        });

    } catch (error) {
        return handleApiError(error, 'API_TECHNICAL_STATS_GET', correlationId);
    }
}, { endpoint: 'GET /api/technical/stats', thresholdMs: 300 });
