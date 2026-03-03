import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { TranslationService } from '@/services/core/translation-service';
import { handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { enforcePermission } from '@/lib/guardian-guard';

async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await enforcePermission('platform:settings', 'manage');
        const result = await TranslationService.forceSyncAllLocales('platform_master');

        await logEvento({ level: 'INFO', source: 'API_I18N_SYNC', action: 'SYNC_COMPLETE', message: 'I18n synchronization completed successfully', correlationId, details: { stats: result } });
        return NextResponse.json({ success: true, stats: result });
    } catch (error: unknown) {
        return handleApiError(error, 'API_I18N_SYNC', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/i18n-sync', thresholdMs: 2000 });
