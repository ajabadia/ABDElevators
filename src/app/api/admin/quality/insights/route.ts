import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { QualityInsightsService } from '@/services/admin/quality-insights-service';
import { AppError, ValidationError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { UserRole } from '@/types/roles';
import { TenantIdSchema } from '@/lib/schemas';

/**
 * 🚀 GET /api/admin/quality/insights
 * Phase 308: Quality Insights API for the suite.
 */
export async function GET(req: Request) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
            throw new AppError('UNAUTHORIZED', 403, 'Only admins can access quality insights');
        }

        const tenantId = TenantIdSchema.parse((session.user as any).tenantId);
        if (!tenantId) throw new ValidationError('Tenant ID missing in session');

        // Parallelize data fetching
        const [globalStats, manualInsights] = await Promise.all([
            QualityInsightsService.getGlobalQuality({ tenantId }),
            QualityInsightsService.getManualInsights(tenantId)
        ]);

        const duration = Date.now() - start;
        await logEvento({
            level: 'INFO',
            source: 'API_QUALITY_INSIGHTS',
            action: 'GET_STATS',
            correlationId,
            details: { duration_ms: duration, tenantId }
        });

        return NextResponse.json({
            success: true,
            data: {
                stats: globalStats,
                manuals: manualInsights
            }
        });

    } catch (error: any) {
        console.error('❌ [QUALITY INSIGHTS API ERROR]', error);

        if (error instanceof AppError) {
            return NextResponse.json(
                { success: false, code: error.code, message: error.message },
                { status: error.status }
            );
        }

        return NextResponse.json(
            { success: false, code: 'INTERNAL_ERROR', message: 'Something went wrong' },
            { status: 500 }
        );
    }
}
