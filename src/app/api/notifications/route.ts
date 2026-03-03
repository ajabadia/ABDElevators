import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/core/NotificationService';
import { handleApiError, AppError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';

async function GET_internal() {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('user:profile', 'read');
        const notifications = await NotificationService.listUnread(session.user.id, session.user.tenantId);
        return NextResponse.json({ notifications });
    } catch (error: unknown) {
        return handleApiError(error, 'API_NOTIFICATIONS_GET', correlationId);
    }
}

async function PATCH_internal(request: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('user:profile', 'read');
        const { ids } = await request.json();
        if (!ids || !Array.isArray(ids)) throw new AppError('VALIDATION_ERROR', 400, 'IDs required');

        await NotificationService.markAsRead(ids, session.user.tenantId);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleApiError(error, 'API_NOTIFICATIONS_PATCH', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/notifications', thresholdMs: 1000 });
export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/notifications', thresholdMs: 1000 });
