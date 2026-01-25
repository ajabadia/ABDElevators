import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB, getMongoClient } from '@/lib/db';
import { AppError, ValidationError, NotFoundError, DatabaseError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { AcceptInviteSchema, UsuarioSchema } from '@/lib/schemas';

/**
 * POST /api/auth/invite/accept
 * Procesa la aceptación de una invitación, crea el usuario y marca la invitación como usada.
 * Utiliza transacciones de MongoDB para asegurar atomicidad (Regla de Oro #7).
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const body = await req.json();
        const validated = AcceptInviteSchema.parse(body);

        const client = await getMongoClient();
        const db = await connectAuthDB();

        // 1. Verificar la invitación
        const invite = await db.collection('invitaciones').findOne({ token: validated.token });

        if (!invite) {
            throw new NotFoundError('Invitación no encontrada');
        }

        if (invite.estado !== 'PENDIENTE') {
            throw new AppError('INVITE_ALREADY_USED', 400, `Esta invitación ya no es válida (${invite.estado.toLowerCase()})`);
        }

        if (new Date() > new Date(invite.expira)) {
            throw new AppError('INVITE_EXPIRED', 400, 'La invitación ha expirado');
        }

        // 2. Verificar si el usuario se registró mientras tanto por otra vía
        const existingUser = await db.collection('users').findOne({ email: invite.email });
        if (existingUser) {
            throw new ValidationError('El email asignado a esta invitación ya está registrado');
        }

        // 3. Preparar datos del usuario
        const hashedPassword = await bcrypt.hash(validated.password, 10);

        const nuevoUsuario = {
            email: invite.email,
            password: hashedPassword,
            nombre: validated.nombre,
            apellidos: validated.apellidos,
            puesto: '',
            rol: invite.rol,
            tenantId: invite.tenantId,
            industry: invite.industry || 'ELEVATORS',
            activeModules: ['TECHNICAL', 'RAG'],
            activo: true,
            creado: new Date(),
            modificado: new Date(),
        };

        const validatedUser = UsuarioSchema.parse(nuevoUsuario);

        // 4. Ejecutar transacción (SI EL CLUSTER LO SOPORTA)
        // Nota: session.withTransaction requiere que MongoDB sea un Replica Set.
        // En Atlas (Free Tier o superior) siempre lo es.
        const session = client.startSession();

        try {
            await session.withTransaction(async () => {
                // A. Crear usuario
                await db.collection('users').insertOne(validatedUser, { session });

                // B. Marcar invitación como usada
                await db.collection('invitaciones').updateOne(
                    { _id: invite._id },
                    {
                        $set: {
                            estado: 'ACEPTADA',
                            usadoAt: new Date()
                        }
                    },
                    { session }
                );
            });
        } finally {
            await session.endSession();
        }

        await logEvento({
            nivel: 'INFO',
            origen: 'API_INVITE_ACCEPT',
            accion: 'INVITE_ACCEPTED',
            mensaje: `Invitación aceptada por ${invite.email} en tenant ${invite.tenantId}`,
            correlacion_id,
            detalles: { email: invite.email, tenantId: invite.tenantId, rol: invite.rol }
        });

        return NextResponse.json({
            success: true,
            message: 'Cuenta creada correctamente. Ahora puedes iniciar sesión.'
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Datos de registro inválidos', error.issues).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_INVITE_ACCEPT',
            accion: 'ACCEPT_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al procesar el registro').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 2000) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_INVITE_ACCEPT',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `POST /api/auth/invite/accept tomó ${duracion}ms`,
                correlacion_id
            });
        }
    }
}
