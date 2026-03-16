import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/core/NotificationService';
import { handleApiError, AppError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/notifications
 * List unread notifications for current user.
 */
export const GET = withPerformanceSLA(async () =>
    withCorrelation(
        { level: 'INFO', source: 'APINOTIFICATIONS', action: 'LISTUNREAD' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('user:profile', 'read');
                const notifications = await NotificationService.listUnread(session.user.id, session.user.tenantId);

                await log({
                    message: 'Unread notifications listed',
                    details: {
                        userId: session.user.id,
                        count: notifications.length
                    }
                });

                return NextResponse.json({ notifications });
            } catch (error: unknown) {
                return handleApiError(error, 'APINOTIFICATIONS', correlationId);
            }
        }
    ),
    { endpoint: 'GET /api/notifications', thresholdMs: 1000 }
);

/**
 * PATCH /api/notifications
 * Mark multiple notifications as read.
 */
export const PATCH = withPerformanceSLA(async (request: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APINOTIFICATIONS', action: 'MARKREAD' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('user:profile', 'read');
                const { ids } = await request.json();
                
                if (!ids || !Array.isArray(ids)) {
                    throw new AppError('VALIDATION_ERROR', 400, 'IDs required');
                }

                await NotificationService.markAsRead(ids, session.user.tenantId);

                await log({
                    message: 'Notifications marked as read',
                    details: {
                        userId: session.user.id,
                        count: ids.length
                    }
                });

                return NextResponse.json({ success: true });
            } catch (error: unknown) {
                return handleApiError(error, 'APINOTIFICATIONS', correlationId);
            }
        }
    ),
    { endpoint: 'PATCH /api/notifications', thresholdMs: 1000 }
);
