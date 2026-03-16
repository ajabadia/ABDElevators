import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { SovereignOntologyService } from '@/services/core/SovereignOntologyService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ONTOLOGY_EVOLUTION', action: 'GENERATE_PROPOSALS' },
        async ({ log, correlationId }) => {
            try {
                await requirePermission('platform:settings', 'read');
                const tenantId = req.nextUrl.searchParams.get('tenantId') || 'SYSTEM';
                const proposals = await SovereignOntologyService.generateProposals(tenantId, correlationId);
                const drift = await SovereignOntologyService.analyzeFeedbackDrift(tenantId);

                await log({
                    message: `Generated ontology proposals for tenant ${tenantId}`,
                    details: { tenantId, proposalCount: proposals.length, driftCount: drift.length }
                });

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
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/superadmin/ontology/evolution', thresholdMs: 1000 });
