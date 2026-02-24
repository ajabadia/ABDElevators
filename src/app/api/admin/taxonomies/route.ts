import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TaxonomyService } from '@/services/core/taxonomy-service';
import { AppError, ValidationError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/taxonomias
 * Obtiene las taxonomías para el tenant e industria del usuario.
 */
export async function GET(req: NextRequest) {
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
export async function POST(req: NextRequest) {
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
