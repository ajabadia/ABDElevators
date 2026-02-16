import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadProfilePhoto } from '@/lib/cloudinary';
import { connectAuthDB } from '@/lib/db';
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
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id } = await params;
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            throw new ValidationError('No se subió ningún archivo');
        }

        const authDb = await connectAuthDB();
        const user = await authDb.collection('users').findOne({ _id: new ObjectId(id) });

        if (!user) {
            throw new NotFoundError('Usuario no encontrado');
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const tenantId = user.tenantId;
        if (!tenantId) {
            throw new AppError('TENANT_CONFIG_ERROR', 500, 'El usuario no tiene un tenantId asociado');
        }
        const result = await uploadProfilePhoto(buffer, file.name, tenantId, id);

        // Actualizar el documento del usuario en la base de datos de identidad
        await authDb.collection('users').updateOne(
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
            level: 'INFO',
            source: 'API_ADMIN_PHOTO',
            action: 'ADMIN_UPLOAD_PHOTO',
            message: `Admin ${session.user.email} cambió foto de perfil para usuario ${id}`, correlationId: correlacion_id,
            details: { targetUserId: id, public_id: result.publicId }
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
            level: 'ERROR',
            source: 'API_ADMIN_PHOTO',
            action: 'UPLOAD_ERROR',
            message: error.message, correlationId: correlacion_id,
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
                level: 'WARN',
                source: 'API_ADMIN_PHOTO',
                action: 'SLA_VIOLATION',
                message: `Admin photo upload lenta: ${duracion}ms`, correlationId: correlacion_id,
                details: { duracion_ms: duracion }
            });
        }
    }
}
