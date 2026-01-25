import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB, connectAuthDB } from '@/lib/db';
import { uploadUserDocument } from '@/lib/cloudinary';
import { DocumentoUsuarioSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/auth/documentos
 * Lista todos los documentos del usuario autenticado.
 * SLA: P95 < 200ms
 */
export async function GET() {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const authDb = await connectAuthDB();
        const user = await authDb.collection('users').findOne({ email: session.user.email });
        if (!user) throw new NotFoundError('Usuario no encontrado');

        const db = await connectDB();
        const documentos = await db.collection('documentos_usuarios')
            .find({ usuario_id: user._id.toString() })
            .sort({ creado: -1 })
            .toArray();

        return NextResponse.json(documentos);
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            nivel: 'ERROR',
            origen: 'API_DOCS_USUARIO',
            accion: 'GET_DOCS_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al obtener documentos').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 200) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_DOCS_USUARIO',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `GET /api/auth/documentos tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}

/**
 * POST /api/auth/documentos
 * Sube un nuevo documento personal para el usuario.
 * SLA: P95 < 2000ms (debido al upload a Cloudinary)
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const descripcion = formData.get('descripcion') as string;

        if (!file) {
            throw new ValidationError('No se subió ningún archivo');
        }

        const authDb = await connectAuthDB();
        const user = await authDb.collection('users').findOne({ email: session.user.email });
        if (!user) throw new NotFoundError('Usuario no encontrado');

        const db = await connectDB();
        const buffer = Buffer.from(await file.arrayBuffer());
        const tenantId = user.tenantId || 'default_tenant';
        const uploadResult = await uploadUserDocument(buffer, file.name, tenantId, user._id.toString());

        const docData = {
            usuario_id: user._id.toString(),
            nombre_original: file.name,
            nombre_guardado: uploadResult.publicId,
            cloudinary_url: uploadResult.secureUrl,
            cloudinary_public_id: uploadResult.publicId,
            tipo_mime: file.type,
            tamanio_bytes: file.size,
            descripcion: descripcion || '',
            creado: new Date(),
        };

        // REGLA #2: Zod Validation BEFORE Processing (final persist)
        const validated = DocumentoUsuarioSchema.parse(docData);
        await db.collection('documentos_usuarios').insertOne(validated);

        await logEvento({
            nivel: 'INFO',
            origen: 'API_DOCS_USUARIO',
            accion: 'UPLOAD_DOC',
            mensaje: `Documento subido por ${user.email}: ${file.name}`,
            correlacion_id,
            detalles: { filename: file.name, size: file.size }
        });

        return NextResponse.json({ success: true, url: uploadResult.secureUrl });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Metadatos de documento inválidos', error.issues).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_DOCS_USUARIO',
            accion: 'UPLOAD_DOC_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al subir documento').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 2000) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_DOCS_USUARIO',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `POST /api/auth/documentos tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
