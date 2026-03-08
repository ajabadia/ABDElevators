import { NextResponse } from 'next/server';
import { IntelligenceService } from '@/services/admin/IntelligenceService';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

/**
 * GET /api/admin/intelligence/stats
 * Returns global intelligence metrics.
 */
export const GET = withPerformanceSLA(async () => {
    const correlationId = crypto.randomUUID();
    try {
        await requirePermission('intelligence:stats', 'read');

        const stats = await IntelligenceService.getStats();

        return NextResponse.json({ success: true, stats });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_INTELLIGENCE_STATS_GET', correlationId);
    }
}, { endpoint: 'GET /api/admin/intelligence/stats', thresholdMs: 300 });
