import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { connectLogsDB } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * 🤖 GET /api/admin/superadmin/playbooks
 * Returns recent Operational Autopilot actions from logs.
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_SUPERADMIN_PLAYBOOKS', action: 'LIST_ACTIONS' },
        async ({ log, correlationId }) => {
            try {
                await requirePermission('platform:metrics', 'read');

                const db = await connectLogsDB();

                // Fetch last 10 'OPS_PLAYBOOK' actions
                const playbookLogs = await db.collection('application_logs')
                    .find({ source: 'OPS_PLAYBOOK', action: { $ne: 'AUTOPILOT_START' } })
                    .sort({ timestamp: -1 })
                    .limit(10)
                    .toArray();

                const formattedPlaybooks = playbookLogs.map(logitem => ({
                    id: logitem._id,
                    action: logitem.action,
                    message: logitem.message,
                    tenantId: logitem.details?.tenantId || 'GLOBAL',
                    severity: logitem.level,
                    timestamp: logitem.timestamp,
                    details: logitem.details
                }));

                await log({
                    message: `Retrieved ${formattedPlaybooks.length} autopilot playbook actions`,
                    details: { count: formattedPlaybooks.length }
                });

                return NextResponse.json({
                    success: true,
                    playbooks: formattedPlaybooks,
                    timestamp: new Date(),
                    correlationId
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_SUPERADMIN_PLAYBOOKS', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, {
    endpoint: 'GET /api/admin/superadmin/playbooks',
    thresholdMs: 500
});
