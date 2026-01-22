import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { CreateUserSchema, UsuarioSchema } from '@/lib/schemas';
import { AppError, ValidationError, DatabaseError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/usuarios
 * Lista todos los usuarios (solo ADMIN)
 * SLA: P95 < 200ms
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const db = await connectDB();
        const usuarios = await db.collection('usuarios')
            .find({}, { projection: { password: 0 } })
            .sort({ creado: -1 })
            .toArray();

        return NextResponse.json({ usuarios });
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            nivel: 'ERROR',
            origen: 'API_ADMIN_USUARIOS',
            accion: 'GET_USERS_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al obtener usuarios').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 200) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_ADMIN_USUARIOS',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `GET /api/admin/usuarios tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}

/**
 * POST /api/admin/usuarios
 * Crea un nuevo usuario (solo ADMIN)
 * SLA: P95 < 1000ms
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const body = await req.json();

        // REGLA #2: Zod Validation BEFORE Processing
        const validated = CreateUserSchema.parse(body);

        const db = await connectDB();

        // Verificar que el email no exista
        const existingUser = await db.collection('usuarios').findOne({
            email: validated.email
        });

        if (existingUser) {
            throw new ValidationError('El email ya está registrado');
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
            activeModules: validated.activeModules || ['TECHNICAL', 'RAG'],
            tenantId: (session.user as any).tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant',
            industry: (session.user as any).industry || 'ELEVATORS',
            activo: true,
            creado: new Date(),
            modificado: new Date(),
        };

        // Validar contra el esquema maestro de base de datos
        const validatedUser = UsuarioSchema.parse(nuevoUsuario);
        const result = await db.collection('usuarios').insertOne(validatedUser);

        if (!result.insertedId) {
            throw new DatabaseError('No se pudo insertar el usuario');
        }

        await logEvento({
            nivel: 'INFO',
            origen: 'API_ADMIN_USUARIOS',
            accion: 'CREATE_USER',
            mensaje: `Usuario creado: ${validated.email}`,
            correlacion_id,
            detalles: { email: validated.email, rol: validated.rol }
        });

        return NextResponse.json({
            success: true,
            usuario_id: result.insertedId,
            temp_password: tempPassword,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Datos de usuario inválidos', error.errors).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_ADMIN_USUARIOS',
            accion: 'CREATE_USER_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al crear usuario').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 1000) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_ADMIN_USUARIOS',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `POST /api/admin/usuarios tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
