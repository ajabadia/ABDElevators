import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { SovereignOntologyService } from '@/services/core/SovereignOntologyService';
import { handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';

async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await enforcePermission('platform:settings', 'read');
        const tenantId = req.nextUrl.searchParams.get('tenantId') || 'SYSTEM';
        const proposals = await SovereignOntologyService.generateProposals(tenantId, correlationId);
        const drift = await SovereignOntologyService.analyzeFeedbackDrift(tenantId);

        return NextResponse.json({
            success: true, tenantId,
            evolution: {
                totalDriftPoints: drift.length, pendingProposals: proposals.length, proposals,
                driftSummary: drift.map(d => ({ target: d._id.category || 'General', from: d._id.original, to: d._id.corrected, frequency: d.count }))
            },
            correlationId
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_ONTOLOGY_EVOLUTION', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/superadmin/ontology/evolution', thresholdMs: 1000 });
