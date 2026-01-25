import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { AdminUpdateUserSchema } from '@/lib/schemas';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * PATCH /api/admin/usuarios/[id]
 * Actualiza datos de un usuario (solo ADMIN)
 * SLA: P95 < 400ms
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        const isAdmin = session?.user?.role === 'ADMIN';
        const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

        if (!isAdmin && !isSuperAdmin) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id } = await params;
        const body = await req.json();

        // REGLA #2: Zod Validation BEFORE Processing
        const validated = AdminUpdateUserSchema.parse(body);

        const db = await connectAuthDB();

        // Aislamiento: Si es Admin, verificar que el usuario a editar pertenezca a su tenant
        if (isAdmin) {
            const userToEdit = await db.collection('users').findOne({ _id: new ObjectId(id) });
            if (!userToEdit) {
                throw new NotFoundError('Usuario no encontrado');
            }
            if (userToEdit.tenantId !== session?.user?.tenantId) {
                await logEvento({
                    nivel: 'WARN',
                    origen: 'API_ADMIN_USUARIOS',
                    accion: 'CROSS_TENANT_ACCESS_ATTEMPT',
                    mensaje: `Admin ${session?.user?.email} intentó modificar usuario de otro tenant: ${id}`,
                    correlacion_id,
                    detalles: { targetUserId: id, adminTenant: session?.user?.tenantId, userTenant: userToEdit.tenantId }
                });
                throw new AppError('FORBIDDEN', 403, 'No tienes permisos para modificar usuarios de otras organizaciones');
            }
        }

        const updateData: any = {
            ...validated,
            modificado: new Date()
        };

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            throw new NotFoundError('Usuario no encontrado');
        }

        await logEvento({
            nivel: 'INFO',
            origen: 'API_ADMIN_USUARIOS',
            accion: 'UPDATE_USER',
            mensaje: `Usuario actualizado: ${id}`,
            correlacion_id,
            detalles: { userId: id, updatedFields: Object.keys(validated) }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Datos de actualización inválidos', error.issues).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_ADMIN_USUARIOS',
            accion: 'UPDATE_USER_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al actualizar usuario').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 400) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_ADMIN_USUARIOS',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `PATCH /api/admin/usuarios/[id] tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}

/**
 * GET /api/admin/usuarios/[id]
 * Obtiene un usuario por ID
 * SLA: P95 < 200ms
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        const isAdmin = session?.user?.role === 'ADMIN';
        const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

        if (!isAdmin && !isSuperAdmin) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id } = await params;
        const db = await connectAuthDB();
        const usuario = await db.collection('users').findOne({ _id: new ObjectId(id) });

        if (!usuario) {
            throw new NotFoundError('Usuario no encontrado');
        }

        // Aislamiento: Si es Admin, verificar tenantId
        if (isAdmin && usuario.tenantId !== session?.user?.tenantId) {
            throw new AppError('FORBIDDEN', 403, 'No autorizado para ver este usuario');
        }

        const { password, ...safeUser } = usuario;
        return NextResponse.json(safeUser);
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            nivel: 'ERROR',
            origen: 'API_ADMIN_USUARIOS',
            accion: 'GET_USER_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error del servidor').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 200) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_ADMIN_USUARIOS',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `GET /api/admin/usuarios/[id] tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
