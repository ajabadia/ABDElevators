import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeReviewService } from '@/lib/services/knowledge-review-service';
import { NotificationService } from '@/lib/notification-service';
import { TenantService } from '@/lib/tenant-service';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * Cron Job: Knowledge Review Alerts (FASE 81)
 * Scheduled to run daily to notify admins about expiring documents.
 */
export async function GET(req: NextRequest) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    // Security check: Verify Cron Secret (Simple pattern)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const tenants = await TenantService.getAllTenants();
        const results: any[] = [];

        for (const tenant of tenants) {
            const tenantId = tenant.tenantId;

            // Get assets expiring in the next 15 days
            const expiringAssets = await KnowledgeReviewService.getExpiringAssets(tenantId, 15);

            if (expiringAssets.length > 0) {
                // Send notification to Tenant Admins
                await NotificationService.notify({
                    tenantId,
                    type: 'SYSTEM',
                    level: 'WARNING',
                    title: 'Revisión de Documentos Pendiente',
                    message: `Tienes ${expiringAssets.length} documentos cuya vigencia expira pronto. Por favor, revísalos en el Panel de Gestión.`,
                    link: '/admin/knowledge',
                    metadata: {
                        expiringCount: expiringAssets.length,
                        assets: expiringAssets.map((a: any) => a.filename).slice(0, 5) // Send some info
                    }
                });

                results.push({
                    tenantId,
                    notified: true,
                    count: expiringAssets.length
                });
            }
        }

        await logEvento({
            level: 'INFO',
            source: 'CRON_KNOWLEDGE_REVIEW',
            action: 'RUN_SUCCESS',
            message: `Knowledge review cron completed for ${tenants.length} tenants`,
            correlationId,
            details: { results, durationMs: Date.now() - start }
        });

        return NextResponse.json({
            success: true,
            processedTenants: tenants.length,
            results
        });

    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'CRON_KNOWLEDGE_REVIEW',
            action: 'RUN_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
