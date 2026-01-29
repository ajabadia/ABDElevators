import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * GET /api/tecnico/pedidos
 * Lista de pedidos del tenant actual.
 * Admite paginación y búsqueda básica.
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const { searchParams } = new URL(req.url);

    // Parámetros de búsqueda y paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    try {
        const collection = await getTenantCollection('pedidos');

        // Construir filtro
        const filter: any = {};
        if (search) {
            filter.$or = [
                { numero_pedido: { $regex: search, $options: 'i' } },
                { nombre_archivo: { $regex: search, $options: 'i' } },
                { cliente: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) {
            filter.estado = status;
        }

        const skip = (page - 1) * limit;

        // Ejecutar query
        const [pedidos, total] = await Promise.all([
            collection.find(filter, {
                sort: { creado: -1 },
                skip,
                limit
            }),
            collection.countDocuments(filter)
        ]);

        return NextResponse.json({
            success: true,
            pedidos,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            },
            correlacion_id
        });

    } catch (error: any) {
        console.error('[API_PEDIDOS_LIST] Error:', error);

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_PEDIDOS_LIST',
            accion: 'GET_LIST',
            mensaje: error.message,
            correlacion_id
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error recuperando lista de pedidos').toJSON(),
            { status: 500 }
        );
    }
}
