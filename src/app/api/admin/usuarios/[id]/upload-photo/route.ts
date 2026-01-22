import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadProfilePhoto } from '@/lib/cloudinary';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * POST /api/admin/usuarios/[id]/upload-photo
 * Permite a un ADMIN subir una foto de perfil para cualquier usuario.
 * SLA: P95 < 2000ms
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id } = await params;
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            throw new ValidationError('No se subió ningún archivo');
        }

        const db = await connectDB();
        const user = await db.collection('usuarios').findOne({ _id: new ObjectId(id) });

        if (!user) {
            throw new NotFoundError('Usuario no encontrado');
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const tenantId = user.tenantId || 'default_tenant';
        const result = await uploadProfilePhoto(buffer, file.name, tenantId, id);

        // Actualizar el documento del usuario en la base de datos
        await db.collection('usuarios').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    foto_url: result.secureUrl,
                    foto_cloudinary_id: result.publicId,
                    modificado: new Date()
                }
            }
        );

        await logEvento({
            nivel: 'INFO',
            origen: 'API_ADMIN_PHOTO',
            accion: 'ADMIN_UPLOAD_PHOTO',
            mensaje: `Admin ${session.user.email} cambió foto de perfil para usuario ${id}`,
            correlacion_id,
            detalles: { targetUserId: id, public_id: result.publicId }
        });

        return NextResponse.json({
            url: result.secureUrl,
            public_id: result.publicId
        });
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_ADMIN_PHOTO',
            accion: 'UPLOAD_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al subir imagen').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 2000) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_ADMIN_PHOTO',
                accion: 'SLA_VIOLATION',
                mensaje: `Admin photo upload lenta: ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
