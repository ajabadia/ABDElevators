import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { SessionService } from "@/services/auth/SessionService";
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/auth/profile/sesiones
 * Retrieves all active sessions for the current user.
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_AUTH_SESSIONS', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('profile', 'read');

                const sessions = await SessionService.getUserSessions(session.user.id, session.user.tenantId);

                // Mark the current session
                const sessionId = (session as any).sessionId;
                const mappedSessions = sessions.map(s => ({
                    ...s,
                    isCurrent: s._id?.toString() === sessionId
                }));

                await log({
                    message: `User sessions retrieved: ${sessions.length}`,
                    details: { count: sessions.length },
                    tenantId: session.user.tenantId
                });

                return NextResponse.json({ sessions: mappedSessions });
            } catch (error: unknown) {
                return handleApiError(error, 'API_AUTH_SESSIONS_GET', correlationId);
            }
        }
    );
}

/**
 * DELETE /api/auth/profile/sesiones
 * Revokes a specific session (Remote Logout).
 */
async function DELETE_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'WARN', source: 'API_AUTH_SESSIONS', action: 'REVOKE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('profile', 'write');

                const { searchParams } = new URL(req.url);
                const targetId = searchParams.get('id');
                const revokeAll = searchParams.get('all') === 'true';

                if (revokeAll) {
                    const currentSessionId = (session as any).sessionId;
                    await SessionService.revokeAllUserSessions(session.user.id, session.user.tenantId, currentSessionId);
                    
                    await log({
                        level: 'WARN',
                        message: 'All other sessions revoked for user',
                        tenantId: session.user.tenantId
                    });

                    return NextResponse.json({ success: true, message: 'All other sessions have been closed' });
                }

                if (!targetId) {
                    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
                }

                const success = await SessionService.revokeSession(targetId, session.user.id, session.user.tenantId);
                
                await log({
                    message: `Specific session revoked: ${targetId}`,
                    details: { sessionId: targetId },
                    tenantId: session.user.tenantId
                });

                return NextResponse.json({ success });
            } catch (error: unknown) {
                return handleApiError(error, 'API_AUTH_SESSIONS_DELETE', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/auth/profile/sesiones', thresholdMs: 1000 });

export const DELETE = withPerformanceSLA(DELETE_internal, { endpoint: 'DELETE /api/auth/profile/sesiones', thresholdMs: 1000 });
