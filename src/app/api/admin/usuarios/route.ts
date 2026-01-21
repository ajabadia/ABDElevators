import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { UsuarioSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const CreateUserSchema = z.object({
    email: z.string().email(),
    nombre: z.string().min(1),
    apellidos: z.string().min(1),
    puesto: z.string().optional(),
    rol: z.enum(['ADMIN', 'TECNICO', 'INGENIERIA']),
});

/**
 * GET /api/admin/usuarios
 * Lista todos los usuarios (solo ADMIN)
 */
export async function GET(req: NextRequest) {
    try {
        const db = await connectDB();
        const usuarios = await db.collection('usuarios')
            .find({}, { projection: { password: 0 } }) // No devolver contraseñas
            .sort({ creado: -1 })
            .toArray();

        return NextResponse.json({ usuarios });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Error al obtener usuarios' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/usuarios
 * Crea un nuevo usuario (solo ADMIN)
 */
export async function POST(req: NextRequest) {
    const correlacion_id = `create-user-${Date.now()}`;

    try {
        const body = await req.json();
        const validated = CreateUserSchema.parse(body);

        const db = await connectDB();

        // Verificar que el email no exista
        const existingUser = await db.collection('usuarios').findOne({
            email: validated.email
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'El email ya está registrado' },
                { status: 400 }
            );
        }

        // Generar contraseña temporal
        const tempPassword = `temp${Math.random().toString(36).slice(-8)}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const nuevoUsuario = {
            email: validated.email,
            password: hashedPassword,
            nombre: validated.nombre,
            apellidos: validated.apellidos,
            puesto: validated.puesto || '',
            rol: validated.rol,
            activo: true,
            creado: new Date(),
            modificado: new Date(),
        };

        const validatedUser = UsuarioSchema.parse(nuevoUsuario);
        const result = await db.collection('usuarios').insertOne(validatedUser);

        await logEvento({
            nivel: 'INFO',
            origen: 'API_USUARIOS',
            accion: 'CREATE_USER',
            mensaje: `Usuario creado: ${validated.email}`,
            correlacion_id,
            detalles: { email: validated.email, rol: validated.rol }
        });

        return NextResponse.json({
            success: true,
            usuario_id: result.insertedId,
            temp_password: tempPassword, // Devolver para que admin lo comunique
        });
    } catch (error) {
        console.error('Error creating user:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Error al crear usuario' },
            { status: 500 }
        );
    }
}
