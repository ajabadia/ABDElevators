import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from '@/lib/auth';
import { getCrossVerticalEngine } from "@/core/engine/index.server";
import { handleApiError, ValidationError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { AppError } from '@/lib/errors';
import { TenantIdSchema } from '@/lib/schemas';
import { z } from 'zod';

/**
 * POST /api/core/search/cross-vertical
 * Performs a semantic search across verticals (Horizontal Search).
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'APICORE_SEARCH_CROSS', action: 'HORIZONTAL_SEARCH' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('search', 'read');

                // 🛡️ [SECURITY] Layered Rate Limiting (Phase 451)
                const { success: rateLimitOk } = await checkRateLimit(session.user.id, LIMITS.CORE);
                if (!rateLimitOk) {
                    throw new AppError('FORBIDDEN', 429, 'Demasiadas búsquedas. Por favor, espera un poco.');
                }
                // Rule #2: Zod Validation BEFORE Processing
                const body = await req.json();
                const { query } = z.object({ query: z.string().min(1) }).parse(body);

                const tenantId = TenantIdSchema.parse(session.user.tenantId);

                const data = await getCrossVerticalEngine().semanticHorizontalSearch(
                    query,
                    tenantId,
                    correlationId
                );

                await log({
                    message: 'Semantic horizontal search performed',
                    details: {
                        query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
                        verticals: data.results?.length || 0,
                        tenantId
                    }
                });

                return NextResponse.json({
                    success: true,
                    ...data, 
                    correlationId
                });
            } catch (error: unknown) {
                if (error instanceof z.ZodError) {
                    return handleApiError(new ValidationError('Search query invalid', error.issues), 'APICORE_SEARCH_CROSS', correlationId);
                }
                return handleApiError(error, 'APICORE_SEARCH_CROSS', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/core/search/cross-vertical', thresholdMs: 1000 });
