import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { FederatedKnowledgeService } from '@/services/core/FederatedKnowledgeService';
import { logEvento } from '@/lib/logger';
import { z } from 'zod';
import { AppError, handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';

const ValidateSchema = z.object({
    patternId: z.string().min(1),
});

async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('knowledge:asset', 'write');
        const body = await req.json();
        const { patternId } = ValidateSchema.parse(body);

        const success = await FederatedKnowledgeService.validatePattern(patternId, session.user.tenantId);

        if (success) {
            await logEvento({
                level: 'INFO', source: 'API_FEDERATED', action: 'PATTERN_VALIDATED',
                message: `Pattern ${patternId} validated`,
                correlationId, tenantId: session.user.tenantId, details: { patternId }
            });
            return NextResponse.json({ success: true });
        } else {
            throw new AppError('NOT_FOUND', 404, 'Pattern not found or not published');
        }

    } catch (error: unknown) {
        return handleApiError(error, 'API_FEDERATED_VALIDATE', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/federated/validate', thresholdMs: 1000 });
