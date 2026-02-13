import { NextRequest, NextResponse } from 'next/server';
import { connectDB, connectAuthDB } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { BulkInviteRequestSchema, UserInviteSchema } from '@/lib/schemas';
import { AppError, ValidationError } from '@/lib/errors';
import * as crypto from 'crypto';
import { UserRole } from '@/types/roles';

/**
 * POST /api/admin/users/invite/bulk
 * Processes multiple invitations in a single request.
 * Returns a summary of success and failures.
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;

        const body = await req.json();
        const validated = BulkInviteRequestSchema.parse(body);

        const authDb = await connectAuthDB();
        const bizDb = await connectDB(); // Although mostly logic is in Auth DB

        const results = {
            total: validated.invitations.length,
            success: 0,
            failed: 0,
            errors: [] as { email: string, error: string }[],
        };

        const invitationsToInsert: any[] = [];
        const emailsToNotify: any[] = [];

        // 1. Pre-validation loop
        for (const invite of validated.invitations) {
            const email = invite.email.toLowerCase().trim();

            try {
                // Check existing user
                const existingUser = await authDb.collection('users').findOne({ email });
                if (existingUser) {
                    throw new Error('Email already registered');
                }

                // Check pending invitation
                const existingInvite = await authDb.collection('invitations').findOne({
                    email,
                    status: 'PENDING',
                    expiresAt: { $gt: new Date() }
                });
                if (existingInvite) {
                    throw new Error('Invitation already pending');
                }

                const tenantId = isSuperAdmin && invite.tenantId
                    ? invite.tenantId
                    : session.user.tenantId;

                if (!tenantId) {
                    throw new Error('Tenant ID missing');
                }

                // Get tenant name (Cache potential)
                const tenant = await authDb.collection('tenants').findOne({ tenantId });
                const tenantName = tenant?.name || tenantId;

                const token = crypto.randomBytes(32).toString('hex');
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + (validated.expiresInDays || 7));

                const newInvitation = {
                    email,
                    tenantId,
                    industry: tenant?.industry || 'ELEVATORS',
                    role: invite.role,
                    token,
                    invitedBy: session.user.id || 'system',
                    status: 'PENDING',
                    expiresAt,
                    createdAt: new Date(),
                };

                // Validate against standard schema
                UserInviteSchema.parse(newInvitation);

                invitationsToInsert.push(newInvitation);
                emailsToNotify.push({
                    email,
                    tenantId,
                    tenantName,
                    role: invite.role,
                    token
                });

                results.success++;
            } catch (err: any) {
                results.failed++;
                results.errors.push({ email, error: err.message });
            }
        }

        // 2. Batch Insert
        if (invitationsToInsert.length > 0) {
            await authDb.collection('invitations').insertMany(invitationsToInsert);

            // 3. Batch Notifications (Async)
            const { NotificationService } = await import('@/lib/notification-service');

            // We process notifications in the background or parallel
            // For now, parallel with Promise.allSettled to not block main result if one fails
            await Promise.allSettled(emailsToNotify.map(async (data) => {
                const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup-invite/${data.token}`;

                return NotificationService.notify({
                    tenantId: data.tenantId,
                    type: 'SYSTEM',
                    level: 'INFO',
                    title: `Invitación a ${data.tenantName}`,
                    message: `${session.user.name || 'Un administrador'} te ha invitado a unirte a ${data.tenantName} como ${data.role}.`,
                    link: inviteUrl,
                    metadata: {
                        inviterName: session.user.name || 'Un administrador',
                        role: data.role,
                        inviteUrl
                    },
                    extraRecipients: [data.email]
                });
            }));
        }

        await logEvento({
            level: 'INFO',
            source: 'API_BULK_INVITE',
            action: 'PROCESS_BATCH',
            message: `Processed bulk invite: ${results.success} success, ${results.failed} failed`,
            correlationId,
            details: { ...results, tenantId: session.user.tenantId },
            userEmail: session.user.email ?? undefined
        });

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Invalid bulk data', error.issues).toJSON(),
                { status: 400 }
            );
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_BULK_INVITE',
            action: 'PROCESS_BATCH_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error processing bulk invitations').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 5000) { // Higher threshold for bulk
            await logEvento({
                level: 'WARN',
                source: 'API_BULK_INVITE',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `Bulk invite took ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}
