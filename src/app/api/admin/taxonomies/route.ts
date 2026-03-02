import crypto from 'crypto';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TaxonomyService } from '@/services/core/taxonomy-service';
import { AppError, ValidationError } from '@/lib/errors';

/**
 * GET /api/admin/taxonomias
 * Obtiene las taxonomías para el tenant e industria del usuario.
 */
async function GET_internal (req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') throw new AppError('UNAUTHORIZED', 401, 'No autorizado');

        const industry = session.user.industry || 'ELEVATORS';
        const tenantId = session.user.tenantId;
        if (!tenantId) throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');

        const taxonomies = await TaxonomyService.getTaxonomies(tenantId, industry);
        return NextResponse.json({ taxonomies });

    } catch (error: any) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, error.message).toJSON(), { status: 500 });
    }
}

/**
 * POST /api/admin/taxonomias
 * Crea una nueva taxonomía.
 */
async function POST_internal (req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') throw new AppError('UNAUTHORIZED', 401, 'No autorizado');

        const body = await req.json();
        const tenantId = session.user.tenantId;
        if (!tenantId) throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        const industry = session.user.industry || 'ELEVATORS';

        const result = await TaxonomyService.createTaxonomy({
            ...body,
            tenantId,
            industry
        }, correlacion_id);

        return NextResponse.json(result);

    } catch (error: any) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, error.message).toJSON(), { status: 500 });
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/taxonomies', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/taxonomies', thresholdMs: 1000 });
