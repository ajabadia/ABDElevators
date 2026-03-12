import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { getTenantCollection } from '@/lib/db-tenant';
import { z } from 'zod';

const DetailsSchema = z.object({
    endpoint: z.string(),
    days: z.coerce.number().min(1).max(30).default(7)
});

/**
 * GET /api/admin/audit/sla/details
 * Fetch recent performance logs for a specific endpoint.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await requirePermission('audit:stats', 'read');

        const { searchParams } = new URL(req.url);
        const { endpoint, days } = DetailsSchema.parse(Object.fromEntries(searchParams));

        const since = new Date();
        since.setDate(since.getDate() - days);

        const sysSession = {
            user: {
                id: '000000000000000000000000',
                tenantId: '000000000000000000000000',
                role: 'SUPER_ADMIN'
            }
        };

        const collection = await getTenantCollection('application_logs', sysSession as any, 'LOGS');
        
        const logs = await collection.unsecureRawCollection.find({
            action: 'PERFORMANCE_METRIC',
            "details.endpoint": endpoint,
            timestamp: { $gte: since }
        } as any)
        .sort({ timestamp: -1 } as any)
        .limit(20)
        .toArray();

        return NextResponse.json({ 
            success: true, 
            logs: logs.map(l => ({
                id: l._id.toString(),
                timestamp: l.timestamp,
                durationMs: l.durationMs,
                level: l.level,
                correlationId: l.correlationId || 'N/A'
            }))
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_AUDIT_SLA_DETAILS', correlationId);
    }
}
