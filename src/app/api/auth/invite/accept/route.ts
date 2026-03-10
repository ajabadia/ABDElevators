import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB, getMongoClient } from '@/lib/db';
import { AppError, ValidationError, NotFoundError, handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { AcceptInviteSchema, UserSchema } from '@/lib/schemas';

/**
 * POST /api/auth/invite/accept
 * Processes invitation acceptance, creates the user and marks the invitation as used.
 */
async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        const body = await req.json();
        const validated = AcceptInviteSchema.parse(body);

        const client = await getMongoClient();
        const authDb = await connectAuthDB();

        // 1. Verify invitation
        const invite = await authDb.collection('invitations').findOne({ token: validated.token });

        if (!invite) throw new NotFoundError('Invitación no encontrada');
        if (invite.status !== 'PENDING' && invite.status !== 'PENDIENTE') {
            throw new AppError('INVITE_ALREADY_USED', 400, `Esta invitación ya no es válida (${invite.status.toLowerCase()})`);
        }
        if (new Date() > new Date(invite.expiresAt || invite.expira)) {
            throw new AppError('INVITE_EXPIRED', 400, 'La invitación ha expirado');
        }

        // 2. Check if user registered
        const existingUser = await authDb.collection('users').findOne({ email: invite.email });
        if (existingUser) throw new ValidationError('El email asignado a esta invitación ya está registrado');

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
                await authDb.collection('users').insertOne(validatedUser as any, { session });
                await authDb.collection('invitations').updateOne(
                    { _id: invite._id },
                    { $set: { status: 'ACCEPTED', usedAt: new Date() } },
                    { session }
                );
            });
        } finally {
            await session.endSession();
        }

        await logEvento({
            level: 'INFO', source: 'AUTH_INVITE_ACCEPT_API', action: 'INVITE_ACCEPTED',
            message: `Invitation accepted by ${invite.email}`,
            correlationId, details: { email: invite.email, tenantId: invite.tenantId }
        });

        return NextResponse.json({ success: true, message: 'Cuenta creada correctamente' });

    } catch (error: unknown) {
        return handleApiError(error, 'AUTH_INVITE_ACCEPT_API', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/auth/invite/accept', thresholdMs: 2000 });
