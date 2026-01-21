import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

/**
 * POST /api/admin/usuarios/[id]/reset-password
 * Resetea la contraseña de un usuario (solo ADMIN)
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const correlacion_id = `reset-password-${Date.now()}`;

    try {
        const db = await connectDB();

        const usuario = await db.collection('usuarios').findOne({
            _id: new ObjectId(params.id)
        });

        if (!usuario) {
            return NextResponse.json(
                { error: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        // Generar nueva contraseña temporal
        const tempPassword = `temp${Math.random().toString(36).slice(-8)}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await db.collection('usuarios').updateOne(
            { _id: new ObjectId(params.id) },
            {
                $set: {
                    password: hashedPassword,
                    modificado: new Date()
                }
            }
        );

        await logEvento({
            nivel: 'INFO',
            origen: 'API_USUARIOS',
            accion: 'RESET_PASSWORD',
            mensaje: `Contraseña reseteada para: ${usuario.email}`,
            correlacion_id,
            detalles: { usuario_id: params.id }
        });

        return NextResponse.json({
            success: true,
            temp_password: tempPassword,
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        return NextResponse.json(
            { error: 'Error al resetear contraseña' },
            { status: 500 }
        );
    }
}
