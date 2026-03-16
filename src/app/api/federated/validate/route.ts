import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { FederatedKnowledgeService } from '@/services/core/FederatedKnowledgeService';
import { z } from 'zod';
import { AppError, handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

const ValidateSchema = z.object({
    patternId: z.string().min(1),
});

/**
 * POST /api/federated/validate
 * Validates a federated pattern for a specific tenant.
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'APIFEDERATED_VALIDATE', action: 'PATTERN_VALIDATION' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge:asset', 'write');
                const body = await req.json();
                const { patternId } = ValidateSchema.parse(body);

                const success = await FederatedKnowledgeService.validatePattern(patternId, session.user.tenantId);

                if (!success) {
                    throw new AppError('NOT_FOUND', 404, 'Pattern not found or not published');
                }

                await log({
                    message: `Federated pattern validated: ${patternId}`,
                    details: { 
                        patternId, 
                        tenantId: session.user.tenantId,
                        userId: session.user.id
                    }
                });

                return NextResponse.json({ success: true, correlationId });

            } catch (error: unknown) {
                return handleApiError(error, 'APIFEDERATED_VALIDATE', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/federated/validate', thresholdMs: 1000 });
