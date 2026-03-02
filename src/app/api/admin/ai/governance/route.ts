import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextResponse } from 'next/server';
import { AiModelManager } from '@/services/core/ai-model-manager';
import { SecureLoupeInspector } from '@/services/security/secure-loupe-inspector';
import { auth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

/**
 * GET /api/admin/ai/governance
 * Retrieve current AI configuration.
 */
async function GET_internal () {
    const session = await auth();
    if (!session || (session.user?.role !== 'SUPER_ADMIN' && session.user?.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const config = await AiModelManager.getTenantAiConfig(session as any);
        return NextResponse.json(config);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/ai/governance
 * Update AI configuration.
 */
async function PATCH_internal (req: Request) {
    const session = await auth();
    if (!session || (session.user?.role !== 'SUPER_ADMIN' && session.user?.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const tenantId = body.tenantId || session.user?.tenantId || 'platform_master';

        await AiModelManager.updateTenantAiConfig(session as any, tenantId, body);

        // Optional: Run security inspection after config change
        // Removed `SecureLoupeInspector.inspectContext` because it does not exist.

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error instanceof AppError ? error.status : 500 });
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/ai/governance', thresholdMs: 1000 });

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/admin/ai/governance', thresholdMs: 1000 });
