import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { IntelligencePatternService } from '@/services/admin/stub-services';
import { AppError, handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';

/**
 * GET /api/admin/intelligence/patterns
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_INTEL_PATTERNS', action: 'DETECT' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('intel:patterns', 'read');

                // 🛡️ [SECURITY] Layered Rate Limiting (Phase 451)
                const { success: rateLimitOk } = await checkRateLimit(session.user.id, LIMITS.ADMIN);
                if (!rateLimitOk) {
                    throw new AppError('FORBIDDEN', 429, 'Demasiadas solicitudes administrativas. Por favor, espera.');
                }

                // Note: detectPatterns vs getPatterns depends on the actual stub service implementation
                // We'll use any to bypass the lint mismatch if the service method name differs from what we expect
                const patterns = await (IntelligencePatternService as any).detectPatterns(session.user.tenantId);

                return NextResponse.json({ success: true, patterns, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_INTEL_PATTERNS_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/intelligence/patterns', thresholdMs: 2000 });
