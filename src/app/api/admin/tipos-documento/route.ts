import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { TipoDocumentoSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { AppError, ValidationError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/tipos-documento
 * Lista todos los tipos de documento configurados.
 * SLA: P95 < 200ms
 */
export async function GET() {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const db = await connectDB();
        const tipos = await db.collection('tipos_documento').find({}).toArray();
        return NextResponse.json(tipos);
    } catch (error: any) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'API_TIPOS_DOC',
            accion: 'GET_TYPES_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al obtener tipos de documento').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 200) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_TIPOS_DOC',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `GET /api/admin/tipos-documento tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}

/**
 * POST /api/admin/tipos-documento
 * Crea un nuevo tipo de documento (solo ADMIN).
 * SLA: P95 < 400ms
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const body = await req.json();

        // REGLA #2: Zod Validation BEFORE Processing
        const validated = TipoDocumentoSchema.parse(body);

        const db = await connectDB();
        const result = await db.collection('tipos_documento').insertOne({
            ...validated,
            creado: new Date()
        });

        await logEvento({
            nivel: 'INFO',
            origen: 'API_TIPOS_DOC',
            accion: 'CREATE_TYPE',
            mensaje: `Tipo de documento creado: ${validated.nombre}`,
            correlacion_id,
            detalles: { nombre: validated.nombre }
        });

        return NextResponse.json({ success: true, id: result.insertedId });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Datos de tipo de documento inválidos', error.errors).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_TIPOS_DOC',
            accion: 'CREATE_TYPE_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al crear tipo de documento').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 400) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_TIPOS_DOC',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `POST /api/admin/tipos-documento tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
/**
 * PATCH /api/admin/tipos-documento
 * Actualiza un tipo de documento.
 */
export async function PATCH(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const body = await req.json();
        const { id, ...data } = body;

        if (!id) throw new ValidationError('ID es requerido');

        const db = await connectDB();
        await db.collection('tipos_documento').updateOne(
            { _id: typeof id === 'string' ? new (await import('mongodb')).ObjectId(id) : id },
            { $set: { ...data, actualizado: new Date() } }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error, 'API_TIPOS_DOC_PATCH', correlacion_id);
    }
}

/**
 * DELETE /api/admin/tipos-documento
 * Elimina un tipo de documento si no está en uso.
 */
export async function DELETE(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) throw new ValidationError('ID es requerido');

        const db = await connectDB();
        const objectId = new (await import('mongodb')).ObjectId(id);

        // Verificación de uso antes de borrar
        const enUso = await db.collection('documentos_tecnicos').findOne({
            $or: [
                { tipo_documento_id: id },
                { tipo_documento_id: objectId }
            ]
        });

        if (enUso) {
            throw new AppError('CONFLICT', 409, 'No se puede eliminar: El tipo de documento está siendo utilizado por uno o más archivos.');
        }

        await db.collection('tipos_documento').deleteOne({ _id: objectId });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error, 'API_TIPOS_DOC_DELETE', correlacion_id);
    }
}

function handleApiError(error: any, origin: string, correlacion_id: string) {
    if (error.name === 'ZodError') {
        return NextResponse.json(
            new ValidationError('Datos inválidos', error.errors).toJSON(),
            { status: 400 }
        );
    }
    if (error instanceof AppError) {
        return NextResponse.json(error.toJSON(), { status: error.status });
    }

    console.error(`[${origin}] Error:`, error);
    return NextResponse.json(
        new AppError('INTERNAL_ERROR', 500, 'Error interno del servidor').toJSON(),
        { status: 500 }
    );
}
