import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB, getMongoClient } from '@/lib/db';
import { AppError, ValidationError, NotFoundError, DatabaseError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { AcceptInviteSchema, UserSchema } from '@/lib/schemas';

/**
 * POST /api/auth/invite/accept
 * Processes invitation acceptance, creates the user and marks the invitation as used.
 * Uses MongoDB transactions to ensure atomicity (Rule #7).
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const body = await req.json();
        const validated = AcceptInviteSchema.parse(body);

        const client = await getMongoClient();
        const db = await connectAuthDB();

        // 1. Verify invitation
        const invite = await db.collection('invitations').findOne({ token: validated.token });

        if (!invite) {
            throw new NotFoundError('Invitación no encontrada');
        }

        if (invite.status !== 'PENDING' && invite.status !== 'PENDIENTE') {
            throw new AppError('INVITE_ALREADY_USED', 400, `Esta invitación ya no es válida (${invite.status.toLowerCase()})`);
        }

        if (new Date() > new Date(invite.expiresAt || invite.expira)) {
            throw new AppError('INVITE_EXPIRED', 400, 'La invitación ha expirado');
        }

        // 2. Check if user registered
        const authDb = await connectAuthDB();
        const existingUser = await authDb.collection('users').findOne({ email: invite.email });
        if (existingUser) {
            throw new ValidationError('El email asignado a esta invitación ya está registrado');
        }

        // 3. Prepare user data
        const hashedPassword = await bcrypt.hash(validated.password, 10);

        const newUser = {
            email: invite.email,
            password: hashedPassword,
            firstName: validated.firstName,
            lastName: validated.lastName,
            position: '',
            role: invite.role || invite.rol,
            tenantId: invite.tenantId,
            industry: invite.industry || 'ELEVATORS',
            activeModules: ['TECHNICAL', 'RAG'],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const validatedUser = UserSchema.parse(newUser);

        // 4. Execute transaction
        const session = client.startSession();

        try {
            await session.withTransaction(async () => {
                // A. Create user
                await authDb.collection('users').insertOne(validatedUser, { session });

                // B. Mark invitation as used
                await db.collection('invitations').updateOne(
                    { _id: invite._id },
                    {
                        $set: {
                            status: 'ACCEPTED',
                            usedAt: new Date()
                        }
                    },
                    { session }
                );
            });
        } finally {
            await session.endSession();
        }

        await logEvento({
            level: 'INFO',
            source: 'AUTH_INVITE_ACCEPT_API',
            action: 'INVITE_ACCEPTED',
            message: `Invitation accepted by ${invite.email} in tenant ${invite.tenantId}`,
            correlationId,
            details: { email: invite.email, tenantId: invite.tenantId, role: invite.role || invite.rol }
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
            level: 'ERROR',
            source: 'AUTH_INVITE_ACCEPT_API',
            action: 'ACCEPT_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al procesar el registro').toJSON(),
            { status: 500 }
        );
    } finally {
        const durationMs = Date.now() - start;
        if (durationMs > 2000) {
            await logEvento({
                level: 'WARN',
                source: 'AUTH_INVITE_ACCEPT_API',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `POST /api/auth/invite/accept took ${durationMs}ms`,
                correlationId
            });
        }
    }
}
