import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadProfilePhoto } from '@/lib/cloudinary';
import { connectAuthDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * POST /api/auth/profile/upload-photo
 * Sube una foto de perfil a Cloudinary y devuelve la URL.
 * SLA: P95 < 2000ms
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

        if (!file) {
            throw new ValidationError('No se subió ningún archivo');
        }

        const db = await connectAuthDB();
        const authDb = await connectAuthDB();
        const usuario = await authDb.collection('users').findOne({ email: session.user.email });

        if (!usuario) {
            throw new NotFoundError('Usuario no encontrado');
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const tenantId = usuario.tenantId || session.user.tenantId;

        if (!tenantId) {
            throw new AppError('TENANT_CONFIG_ERROR', 500, 'El usuario no tiene un tenantId asociado');
        }

        const result = await uploadProfilePhoto(buffer, file.name, tenantId, usuario._id.toString());

        // Actualizar el documento del usuario en la base de datos
        await authDb.collection('users').updateOne(
            { email: session.user.email },
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
            source: 'API_PROFILE_PHOTO',
            action: 'UPLOAD_PHOTO',
            message: `Foto de perfil actualizada y persistida para ${session.user.email}`, correlationId: correlacion_id,
            details: { public_id: result.publicId }
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
            source: 'API_PROFILE_PHOTO',
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
                source: 'API_PROFILE_PHOTO',
                action: 'SLA_VIOLATION',
                message: `Carga de foto lenta: ${duracion}ms`, correlationId: correlacion_id,
                details: { duracion_ms: duracion }
            });
        }
    }
}
