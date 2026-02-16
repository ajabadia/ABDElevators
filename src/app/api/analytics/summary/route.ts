import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AnalyticsService } from '@/core/services/AnalyticsService';
import { UsageService } from '@/lib/usage-service';
import { AppError, handleApiError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
    const correlationId = uuidv4();
    try {
        const session = await auth();
        if (!session) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        const tenantId = session.user.tenantId;

        // Parallelize fetching
        const [tokenUsage, ragPerf, health, roi] = await Promise.all([
            AnalyticsService.getDailyTokenUsage(tenantId),
            AnalyticsService.getRAGPerformance(tenantId),
            AnalyticsService.getSystemHealth(tenantId),
            UsageService.getTenantROI(tenantId)
        ]);

        return NextResponse.json({
            success: true,
            data: {
                tokens: tokenUsage,
                rag: ragPerf,
                health: health,
                roi: roi
            }
        });

    } catch (error) {
        return handleApiError(error, 'API_ANALYTICS_SUMMARY', correlationId);
    }
}
