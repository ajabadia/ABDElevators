import { NextRequest, NextResponse } from 'next/server';
import { EntityEngine } from '@/core/engine/EntityEngine';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/core/entities/[type]
 * Lista universal de entidades vía System Engine.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ type: string }> }
) {
    const { type } = await params;
    const correlacion_id = crypto.randomUUID();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    try {
        const entityDef = EntityEngine.getInstance().getEntity(type);
        if (!entityDef) {
            throw new AppError('NOT_FOUND', 404, `Entidad '${type}' no reconocida`);
        }

        const collection = await getTenantCollection(entityDef.slug);

        // Construir filtro basado en campos 'searchable' de la ontología
        const filter: any = {};
        if (search) {
            const searchableFields = entityDef.fields.filter(f => f.searchable).map(f => f.key);
            if (searchableFields.length > 0) {
                filter.$or = searchableFields.map(f => ({
                    [f]: { $regex: search, $options: 'i' }
                }));
            }
        }

        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            collection.find(filter, { sort: { creado: -1, createdAt: -1 } as any, skip, limit }),
            collection.countDocuments(filter)
        ]);

        return NextResponse.json({
            success: true,
            [entityDef.plural]: items, // Usamos el plural de la ontología
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }, correlationId: correlacion_id
        });

    } catch (error: any) {
        console.error(`[ENTITY_CORE_LIST] Error (${type}):`, error);
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, error.message).toJSON(), { status: 500 });
    }
}
