import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';

/**
 * PATCH /api/admin/usuarios/[id]
 * Actualiza datos de un usuario (solo ADMIN)
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const db = await connectDB();

        const updateData: any = {
            modificado: new Date()
        };

        if (body.nombre) updateData.nombre = body.nombre;
        if (body.apellidos) updateData.apellidos = body.apellidos;
        if (body.puesto !== undefined) updateData.puesto = body.puesto;
        if (body.rol) updateData.rol = body.rol;
        if (body.activo !== undefined) updateData.activo = body.activo;

        const result = await db.collection('usuarios').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        await logEvento({
            nivel: 'INFO',
            origen: 'API_ADMIN_USUARIOS',
            accion: 'UPDATE_USER',
            mensaje: `Usuario actualizado: ${id}`,
            correlacion_id: `admin-user-update-${Date.now()}`,
            detalles: { userId: id, updatedFields: Object.keys(updateData) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
    }
}

/**
 * GET /api/admin/usuarios/[id]
 * Obtiene un usuario por ID
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const db = await connectDB();
        const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(id) });

        if (!usuario) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const { password, ...safeUser } = usuario;
        return NextResponse.json(safeUser);
    } catch (error) {
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}
