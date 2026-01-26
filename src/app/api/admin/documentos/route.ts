import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/documentos
 * Lista todos los documentos tecnicos del corpus RAG.
 * SLA: P95 < 500ms
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'INGENIERIA' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const db = await connectDB();
        const searchParams = req.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = parseInt(searchParams.get('skip') || '0');

        const documentos = await db.collection('documentos_tecnicos')
            .find({})
            .sort({ creado: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await db.collection('documentos_tecnicos').countDocuments();

        return NextResponse.json({
            success: true,
            documentos,
            pagination: {
                total,
                limit,
                skip
            }
        });

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_DOCS_LIST',
            accion: 'FETCH_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al listar documentos').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 500) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_DOCS_LIST',
                accion: 'SLA_VIOLATION',
                mensaje: `Listado de documentos lento: ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
