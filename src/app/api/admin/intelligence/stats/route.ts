import { NextResponse } from 'next/server';
import { IntelligenceAnalyticsService } from '@/lib/intelligence-analytics';
import { enforcePermission } from '@/lib/guardian-guard';
import { logEvento } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import crypto from 'crypto';

export async function GET() {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
        const user = await enforcePermission('intelligence:stats', 'read');

        const stats = await IntelligenceAnalyticsService.getStats();

        const duration = Date.now() - startTime;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_INTELLIGENCE',
                action: 'STATS_LATENCY',
                message: `Intelligence stats took ${duration}ms`,
                correlationId,
                tenantId: (user as any).tenantId,
                details: { durationMs: duration }
            });
        }

        return NextResponse.json(stats);
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_INTELLIGENCE_STATS_GET', correlationId);
    }
}
