import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { TaxonomyService } from '@/services/core/taxonomy-service';
import { AppError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';

/**
 * GET /api/admin/taxonomies
 * Retrieves taxonomies for the user's tenant and industry.
 */
async function GET_internal(req: NextRequest) {
    try {
        const session = await requirePermission('platform:settings', 'read');
        const industry = session.user.industry || 'ELEVATORS';
        const tenantId = session.user.tenantId;

        const taxonomies = await TaxonomyService.getTaxonomies(tenantId, industry);
        return NextResponse.json({ taxonomies });

    } catch (error: unknown) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, error instanceof Error ? error.message : 'Unknown error').toJSON(), { status: 500 });
    }
}

/**
 * POST /api/admin/taxonomies
 * Creates a new taxonomy.
 */
async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
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

        return NextResponse.json(result);

    } catch (error: unknown) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, error instanceof Error ? error.message : 'Unknown error').toJSON(), { status: 500 });
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/taxonomies', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/taxonomies', thresholdMs: 1000 });
