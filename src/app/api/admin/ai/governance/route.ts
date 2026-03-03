import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { AiModelManager } from '@/services/core/ai-model-manager';
import { enforcePermission } from '@/lib/guardian-guard';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

import { TenantAiConfigSchema } from '@/lib/schemas/ai-governance';
import { handleApiError } from '@/lib/errors';

/**
 * GET /api/admin/ai/governance
 * Retrieve current AI configuration.
 */
async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('platform:settings', 'read');
        const config = await AiModelManager.getTenantAiConfig(session as any);
        return NextResponse.json(config);
    } catch (error: unknown) {
        return handleApiError(error, 'API_AI_GOVERNANCE_GET', correlationId);
    }
}

/**
 * PATCH /api/admin/ai/governance
 * Update AI configuration.
 */
async function PATCH_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('platform:settings', 'manage');
        const body = await req.json();

        // 🛡️ [SECURITY] Zod Validation BEFORE Processing (Regla #2)
        const validated = TenantAiConfigSchema.parse(body);

        const tenantId = validated.tenantId || session.user?.tenantId || 'platform_master';

        await AiModelManager.updateTenantAiConfig(session as any, tenantId, validated);

        await logEvento({
            level: 'INFO',
            source: 'API_AI_GOVERNANCE',
            action: 'UPDATE_CONFIG',
            message: `AI Configuration updated for tenant ${tenantId}`,
            correlationId,
            details: { updatedBy: session.user?.email, tenantId }
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleApiError(error, 'API_AI_GOVERNANCE_PATCH', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/ai/governance', thresholdMs: 1000 });

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/admin/ai/governance', thresholdMs: 1000 });
