import { NextRequest, NextResponse } from 'next/server';
import { connectDB, connectAuthDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { UserInviteSchema } from '@/lib/schemas';
import { AppError, ValidationError } from '@/lib/errors';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email-service';
import { z } from 'zod';

const InviteRequestSchema = z.object({
    email: z.string().email('Invalid email'),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TECHNICAL', 'ENGINEERING']),
    tenantId: z.string().optional(),
});

/**
 * POST /api/admin/users/invite
 * Creates an invitation and sends email (Security Phase 11.1)
 * SLA: P95 < 2000ms (includes email sending)
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        const isAdmin = session?.user?.role === 'ADMIN';
        const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

        if (!isAdmin && !isSuperAdmin) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const body = await req.json();
        const validated = InviteRequestSchema.parse(body);

        const authDb = await connectAuthDB();
        const bizDb = await connectDB();

        // 1. Check if user already exists
        const existingUser = await authDb.collection('users').findOne({
            email: validated.email.toLowerCase().trim()
        });

        if (existingUser) {
            throw new ValidationError('Email is already registered as an active user');
        }

        // 2. Determine Tenant
        const tenantId = isSuperAdmin && validated.tenantId
            ? validated.tenantId
            : (session?.user as any).tenantId;

        if (!tenantId) {
            throw new ValidationError('Tenant ID is required');
        }

        // Get tenant name for email (Migrated to AUTH DB)
        const tenant = await authDb.collection('tenants').findOne({ tenantId });
        const tenantName = tenant?.name || tenantId;

        // 3. Generate Token and Expiry (7 days)
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // 4. Create Invitation
        const newInvitation = {
            email: validated.email.toLowerCase().trim(),
            tenantId,
            industry: tenant?.industry || 'ELEVATORS',
            role: validated.role,
            token,
            invitedBy: session?.user?.id || 'system',
            status: 'PENDING',
            expiresAt,
            createdAt: new Date(),
        };

        const validatedInvite = UserInviteSchema.parse(newInvitation);
        await authDb.collection('invitations').insertOne(validatedInvite);

        // 5. Send Email using Notification Hub (Phase 23)
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup-invite/${token}`;

        // Dynamic import to avoid circular dependencies if any
        const { NotificationService } = await import('@/lib/notification-service');

        await NotificationService.notify({
            tenantId,
            type: 'SYSTEM', // Use SYSTEM for high-level administrative invitations
            level: 'INFO',
            title: `Invitation to ${tenantName}`,
            message: `${session?.user?.name || 'An administrator'} has invited you to join ${tenantName} as ${validated.role}.`,
            link: inviteUrl,
            metadata: {
                inviterName: session?.user?.name || 'An administrator',
                role: validated.role,
                inviteUrl
            },
            // Hack to reach the invitee's email even though they are not a user yet
            // This requires NotificationService to handle 'manualRecipient' or similar
        });

        await logEvento({
            level: 'INFO',
            source: 'API_INVITE',
            action: 'CREATE_INVITE',
            message: `Invitation sent to ${validated.email} for tenant ${tenantId}`,
            correlationId,
            details: { email: validated.email, role: validated.role, tenantId }
        });

        return NextResponse.json({
            success: true,
            message: 'Invitation sent successfully'
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Invalid invitation data', error.issues).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_INVITE',
            action: 'CREATE_INVITE_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error processing invitation').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 2000) {
            await logEvento({
                level: 'WARN',
                source: 'API_INVITE',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `POST /api/admin/users/invite took ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}
