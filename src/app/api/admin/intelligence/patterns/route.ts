import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { IntelligencePatternService } from '@/services/admin/IntelligencePatternService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/intelligence/patterns
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_INTEL_PATTERNS', action: 'DETECT' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('intel:patterns', 'read');
                const patterns = await IntelligencePatternService.detectPatterns(session.user.tenantId);

                return NextResponse.json({ success: true, patterns, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_INTEL_PATTERNS_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/intelligence/patterns', thresholdMs: 2000 });
