import { connectAuthDB } from '@/lib/db';
import { BulkInviteRequestSchema, UserInviteSchema } from '@/lib/schemas';
import { ValidationError } from '@/lib/errors';
import * as crypto from 'crypto';
import { logEvento } from '@/lib/logger';

export interface BulkInviteInput {
    invitations: any[];
    sessionUser: any;
    isSuperAdmin: boolean;
    correlationId: string;
}

export class BulkInviteUseCase {
    async execute(input: BulkInviteInput) {
        const { invitations, sessionUser, isSuperAdmin, correlationId } = input;
        const authDb = await connectAuthDB();

        const results = {
            total: invitations.length,
            success: 0,
            failed: 0,
            errors: [] as { email: string, error: string }[],
        };

        const invitationsToInsert: any[] = [];
        const emailsToNotify: any[] = [];

        for (const invite of invitations) {
            const email = invite.email.toLowerCase().trim();

            try {
                // 1. Business Rules
                const existingUser = await authDb.collection('users').findOne({ email });
                if (existingUser) throw new Error('Email already registered');

                const existingInvite = await authDb.collection('invitations').findOne({
                    email,
                    status: 'PENDING',
                    expiresAt: { $gt: new Date() }
                });
                if (existingInvite) throw new Error('Invitation already pending');

                const tenantId = isSuperAdmin && invite.tenantId
                    ? invite.tenantId
                    : sessionUser.tenantId;

                if (!tenantId) throw new Error('Tenant ID missing');

                const tenant = await authDb.collection('tenants').findOne({ tenantId });
                const tenantName = tenant?.name || tenantId;

                const token = crypto.randomBytes(32).toString('hex');
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7);

                const newInvitation = {
                    email,
                    tenantId,
                    industry: tenant?.industry || 'ELEVATORS',
                    role: invite.role,
                    token,
                    invitedBy: sessionUser.id || 'system',
                    status: 'PENDING',
                    expiresAt,
                    createdAt: new Date(),
                };

                // 2. Schema Validation
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

        // 3. Persistence
        if (invitationsToInsert.length > 0) {
            await authDb.collection('invitations').insertMany(invitationsToInsert);
        }

        return { results, emailsToNotify };
    }
}
