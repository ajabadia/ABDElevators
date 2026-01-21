import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { UsuarioSchema } from '@/lib/schemas';

export async function GET() {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const db = await connectDB();
        const user = await db.collection('usuarios').findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // No devolver la contraseña
        const { password, ...safeUser } = user;
        return NextResponse.json(safeUser);
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const db = await connectDB();

        // Solo permitir actualizar ciertos campos
        const updateData: any = {
            modificado: new Date()
        };

        if (body.nombre) updateData.nombre = body.nombre;
        if (body.apellidos) updateData.apellidos = body.apellidos;
        if (body.puesto) updateData.puesto = body.puesto;
        if (body.foto_url) updateData.foto_url = body.foto_url;
        if (body.foto_cloudinary_id) updateData.foto_cloudinary_id = body.foto_cloudinary_id;

        const result = await db.collection('usuarios').updateOne(
            { email: session.user.email },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        await logEvento({
            nivel: 'INFO',
            origen: 'API_PERFIL',
            accion: 'UPDATE_PROFILE',
            mensaje: `Perfil actualizado para ${session.user.email}`,
            correlacion_id: `profile-update-${Date.now()}`,
            detalles: { updatedFields: Object.keys(updateData) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}
