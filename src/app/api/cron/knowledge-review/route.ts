import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeReviewService } from '@/services/ingest/knowledge-review-service';
import { NotificationService } from '@/services/core/NotificationService';
import { TenantService } from '@/services/tenant/tenant-service';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function GET_internal(req: NextRequest) {
    return await withCorrelation(
        { level: 'INFO', source: 'CRON_KNOWLEDGE_REVIEW', action: 'REVIEW_JOB' },
        async ({ log, correlationId }) => {
            const authHeader = req.headers.get('authorization');

            if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
                await log({
                    level: 'WARN',
                    action: 'UNAUTHORIZED_ATTEMPT',
                    message: 'Unauthorized cron invocation attempt'
                });
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            try {
                await log({ action: 'START', message: 'Knowledge review job started' });

                const tenants = await TenantService.getAllTenants();
                const results: Array<{ tenantId: string; notified: boolean; count: number }> = [];

                for (const tenant of tenants) {
                    const tenantId = tenant.tenantId;
                    const expiringAssets = await KnowledgeReviewService.getExpiringAssets(tenantId, 15);

                    if (expiringAssets.length > 0) {
                        await NotificationService.notify({
                            tenantId, type: 'SYSTEM', level: 'WARNING', title: 'Revisión Pendiente',
                            message: `Tienes ${expiringAssets.length} documentos expirando pronto.`,
                            link: '/admin/knowledge'
                        });
                        results.push({ tenantId, notified: true, count: expiringAssets.length });
                    }
                }

                await log({
                    action: 'COMPLETED',
                    message: `Knowledge review completed for ${tenants.length} tenants. ${results.length} notified.`,
                    details: { totalTenants: tenants.length, notifiedTenants: results.length }
                });

                return NextResponse.json({ success: true, processedTenants: tenants.length, results });
            } catch (error: unknown) {
                return handleApiError(error, 'CRON_KNOWLEDGE_REVIEW', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/cron/knowledge-review', thresholdMs: 10000 });
