import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { connectLogsDB } from '@/lib/db';
import { enforcePermission } from '@/lib/guardian-guard';

/**
 * 🤖 GET /api/admin/superadmin/playbooks
 * Returns recent Operational Autopilot actions from logs.
 */
async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await enforcePermission('platform:metrics', 'read');

        const db = await connectLogsDB();

        // Fetch last 10 'OPS_PLAYBOOK' actions
        const playbookLogs = await db.collection('application_logs')
            .find({ source: 'OPS_PLAYBOOK', action: { $ne: 'AUTOPILOT_START' } })
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();

        const formattedPlaybooks = playbookLogs.map(log => ({
            id: log._id,
            action: log.action,
            message: log.message,
            tenantId: log.details?.tenantId || 'GLOBAL',
            severity: log.level,
            timestamp: log.timestamp,
            details: log.details
        }));

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

export const GET = withPerformanceSLA(GET_internal, {
    endpoint: 'GET /api/admin/superadmin/playbooks',
    thresholdMs: 500
});
