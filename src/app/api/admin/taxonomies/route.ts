import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { TaxonomyService } from '@/services/core/taxonomy-service';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/taxonomies
 * Retrieves taxonomies for the user's tenant and industry.
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_TAXONOMIES', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('platform:settings', 'read');
                const industry = session.user.industry || 'ELEVATORS';
                const tenantId = session.user.tenantId;

                const taxonomies = await TaxonomyService.getTaxonomies(tenantId, industry);
                
                await log({
                    message: `Retrieved taxonomies for tenant ${tenantId}`,
                    details: { count: taxonomies.length, industry }
                });

                return NextResponse.json({ taxonomies });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_TAXONOMIES_GET', correlationId);
            }
        }
    );
}

/**
 * POST /api/admin/taxonomies
 * Creates a new taxonomy.
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_TAXONOMIES', action: 'CREATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('platform:settings', 'manage');
                const body = await req.json();
                const tenantId = session.user.tenantId;
                const industry = session.user.industry || 'ELEVATORS';

                const result = await TaxonomyService.createTaxonomy({
                    ...body,
                    tenantId,
                    industry
                }, correlationId);

                await log({
                    message: `Taxonomy created for tenant ${tenantId}`,
                    details: { taxonomyId: (result as any)._id || (result as any).id, name: body.name }
                });

                return NextResponse.json(result);

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_TAXONOMIES_POST', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/taxonomies', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/taxonomies', thresholdMs: 1000 });
