import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/services/tenant/tenant-service';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { maskSensitiveData } from '@/lib/sanitization';
async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('user:profile', 'read');
        const config = await TenantService.getConfig(session.user.tenantId);
        const branding = config.branding || { companyName: config.name, colors: { primary: '#0d9488', accent: '#14b8a6' } };

        return NextResponse.json({ success: true, branding: { ...branding, companyName: branding.companyName || config.name } }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error: unknown) {
        return handleApiError(error, 'API_BRANDING', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/tenant/branding', thresholdMs: 1000 });
