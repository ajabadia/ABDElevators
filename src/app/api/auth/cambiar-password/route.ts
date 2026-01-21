import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { logEvento } from '@/lib/logger';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 });
        }

        const db = await connectDB();
        const user = await db.collection('usuarios').findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // Verificar contraseña actual
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordCorrect) {
            return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 });
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.collection('usuarios').updateOne(
            { email: session.user.email },
            {
                $set: {
                    password: hashedPassword,
                    modificado: new Date()
                }
            }
        );

        await logEvento({
            nivel: 'INFO',
            origen: 'API_PERFIL',
            accion: 'CHANGE_PASSWORD',
            mensaje: `Contraseña cambiada para ${session.user.email}`,
            correlacion_id: `pass-change-${Date.now()}`
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error changing password:', error);
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}
