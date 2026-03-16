import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/services/tenant/tenant-service';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { maskSensitiveData } from '@/lib/sanitization';
import { withCorrelation } from '@/lib/logger/with-correlation';

export const GET = withPerformanceSLA(async (req: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APITENANTBRANDING', action: 'GETBRANDING' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('user:profile', 'read');
                const config = await TenantService.getConfig(session.user.tenantId);
                const branding = config.branding || { companyName: config.name, colors: { primary: '#0d9488', accent: '#14b8a6' } };

                await log({
                    message: 'Tenant branding retrieved',
                    details: {
                        tenantId: session.user.tenantId,
                        userId: session.user.id
                    }
                });

                return NextResponse.json(
                    {
                        success: true,
                        branding: { ...branding, companyName: branding.companyName || config.name }
                    },
                    { headers: { 'Cache-Control': 'no-store' } }
                );
            } catch (error: unknown) {
                return handleApiError(error, 'APITENANTBRANDING', correlationId);
            }
        }
    ),
    { endpoint: 'GET /api/tenant/branding', thresholdMs: 1000 }
);
