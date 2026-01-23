import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { pureVectorSearch } from '@/lib/rag-service';
import { logEvento } from '@/lib/logger';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import { ObjectId } from 'mongodb';

/**
 * GET /api/pedidos/[id]/vector-search
 * Búsqueda semántica de alta velocidad para documentos técnicos relacionados con el pedido.
 * SLA: P95 < 200ms
 * Regla de Oro #3: AppError para todo error.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const inicio = Date.now();
    const correlacion_id = crypto.randomUUID();
    const { id } = await params;

    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user?.tenantId || 'default_tenant';

        // 1. Obtener el pedido para extraer contexto
        const db = await connectDB();
        const pedido = await db.collection('pedidos').findOne({
            _id: new ObjectId(id)
        });

        if (!pedido) {
            throw new NotFoundError(`Pedido con ID ${id} no encontrado`);
        }

        // 2. Construir query optimizada basada en modelos detectados
        // Si no hay modelos, usamos el texto original (truncado para evitar latencia)
        let query = '';
        if (pedido.modelos_detectados && pedido.modelos_detectados.length > 0) {
            query = pedido.modelos_detectados
                .map((m: any) => `${m.tipo} ${m.modelo}`)
                .join(' ');
        } else {
            query = pedido.pdf_texto?.substring(0, 500) || '';
        }

        if (!query) {
            return NextResponse.json({ results: [] });
        }

        // 3. Ejecutar búsqueda vectorial pura (Optimizada < 200ms)
        const results = await pureVectorSearch(query, tenantId, correlacion_id, {
            limit: 15,
            min_score: 0.5 // Umbral ligeramente más bajo para mayor cobertura en manuales técnicos
        });

        const duracion = Date.now() - inicio;

        await logEvento({
            nivel: 'INFO',
            origen: 'API_PEDIDOS_VECTOR',
            accion: 'VECTOR_SEARCH_SUCCESS',
            mensaje: `Búsqueda para pedido ${pedido.numero_pedido} completada en ${duracion}ms`,
            correlacion_id,
            detalles: {
                pedido_id: id,
                query,
                results_count: results.length,
                duracion_ms: duracion
            }
        });

        // 4. Retornar resultados con headers de performance
        return NextResponse.json({
            success: true,
            results,
            metadata: {
                duracion_ms: duracion,
                correlacion_id
            }
        }, {
            headers: {
                'X-Response-Time': duracion.toString(),
                'X-Correlacion-ID': correlacion_id
            }
        });

    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json(
                { code: error.code, message: error.message },
                { status: error.status }
            );
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_PEDIDOS_VECTOR',
            accion: 'SEARCH_EXCEPTION',
            mensaje: (error as Error).message,
            correlacion_id,
            stack: (error as Error).stack
        });

        return NextResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Error interno en búsqueda vectorial' },
            { status: 500 }
        );
    }
}
