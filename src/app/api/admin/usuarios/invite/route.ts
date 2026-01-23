import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { InviteSchema } from '@/lib/schemas';
import { AppError, ValidationError } from '@/lib/errors';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email-service';
import { z } from 'zod';

const InviteRequestSchema = z.object({
    email: z.string().email('Email inválido'),
    rol: z.enum(['SUPER_ADMIN', 'ADMIN', 'TECNICO', 'INGENIERIA']),
    tenantId: z.string().optional(),
});

/**
 * POST /api/admin/usuarios/invite
 * Crea una invitación y envía email (Seguridad Fase 11.1)
 * SLA: P95 < 2000ms (includes email sending)
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        const isAdmin = session?.user?.role === 'ADMIN';
        const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

        if (!isAdmin && !isSuperAdmin) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const body = await req.json();
        const validated = InviteRequestSchema.parse(body);

        const db = await connectDB();

        // 1. Verificar si el usuario ya existe
        const existingUser = await db.collection('usuarios').findOne({
            email: validated.email.toLowerCase().trim()
        });

        if (existingUser) {
            throw new ValidationError('El email ya está registrado como usuario activo');
        }

        // 2. Determinar Tenant
        const tenantId = isSuperAdmin && validated.tenantId
            ? validated.tenantId
            : (session?.user as any).tenantId;

        if (!tenantId) {
            throw new ValidationError('Tenant ID es requerido');
        }

        // Obtener nombre del tenant para el email
        const tenant = await db.collection('tenants').findOne({ tenantId });
        const tenantName = tenant?.name || tenantId;

        // 3. Generar Token y Expira (7 días)
        const token = crypto.randomBytes(32).toString('hex');
        const expira = new Date();
        expira.setDate(expira.getDate() + 7);

        // 4. Crear Invitación
        const nuevaInvitacion = {
            email: validated.email.toLowerCase().trim(),
            tenantId,
            industry: tenant?.industry || 'ELEVATORS',
            rol: validated.rol,
            token,
            invitadoPor: session?.user?.id || 'sistema',
            estado: 'PENDIENTE',
            expira,
            creado: new Date(),
        };

        const validatedInvite = InviteSchema.parse(nuevaInvitacion);
        await db.collection('invitaciones').insertOne(validatedInvite);

        // 5. Enviar Email
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup-invite/${token}`;

        await sendInvitationEmail({
            to: validated.email,
            inviterName: session?.user?.name || 'Un administrador',
            tenantName,
            role: validated.rol,
            inviteUrl
        });

        await logEvento({
            nivel: 'INFO',
            origen: 'API_INVITE',
            accion: 'CREATE_INVITE',
            mensaje: `Invitación enviada a ${validated.email} para tenant ${tenantId}`,
            correlacion_id,
            detalles: { email: validated.email, rol: validated.rol, tenantId }
        });

        return NextResponse.json({
            success: true,
            message: 'Invitación enviada correctamente'
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Datos de invitación inválidos', error.errors).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_INVITE',
            accion: 'CREATE_INVITE_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al procesar la invitación').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 2000) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_INVITE',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `POST /api/admin/usuarios/invite tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
