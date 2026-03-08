import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { ObservabilityRepository } from '@/services/observability/ObservabilityRepository';
import { z } from 'zod';

const SLASchema = z.object({
    days: z.coerce.number().min(1).max(30).default(7)
});

/**
 * GET /api/admin/audit/sla
 * Fetch aggregated SLA metrics to display performance dashboards.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await requirePermission('audit:stats', 'read');

        const { searchParams } = new URL(req.url);
        const args = Object.fromEntries(searchParams);
        const { days } = SLASchema.parse(args);

        const metrics = await ObservabilityRepository.getSlaMetrics(days);

        return NextResponse.json({ success: true, metrics, correlationId });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_AUDIT_SLA', correlationId);
    }
}
