import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { User } from '@/lib/schemas';
import { AuditService } from '@/services/admin/AuditService';
import { AppError, handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { z } from 'zod';
import { TenantIdSchema, EntityIdSchema } from '@abd/platform-core';

const PreferencesUpdateSchema = z.object({
    onboarding: z.object({
        completed: z.boolean().optional(),
        currentStep: z.number().optional(),
        userContext: z.enum(['inspection', 'maintenance', 'engineering', 'admin']).optional(),
        firstDocUploaded: z.boolean().optional(),
        firstQuestionAsked: z.boolean().optional()
    }).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().optional()
});

async function GET_internal() {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('user:profile', 'read');

        const userCollection = await getTenantCollection<User>('users', session, 'AUTH');
        let user = await userCollection.findOne({ email: session.user.email as string });

        if (!user) {
            // Auto-create basic preferences for valid session user if not found (ERA 8 Migration)
            const defaultUser = {
                email: session.user.email as string,
                tenantId: TenantIdSchema.parse(session.user.tenantId),
                role: session.user.role as any,
                password: 'MIGRATED', // Placeholder for migrated user
                firstName: session.user.name?.split(' ')[0] || '',
                lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
                preferences: {
                    onboarding: { completed: false, currentStep: 0 },
                    theme: 'system',
                    language: 'en'
                },
                updatedAt: new Date(),
                createdAt: new Date()
            };

            await userCollection.insertOne(defaultUser as User);
            user = defaultUser as User;

            await AuditService.record({
                actorType: 'SYSTEM',
                actorId: EntityIdSchema.parse('ERA8_MIGRATOR'),
                tenantId: TenantIdSchema.parse(session.user.tenantId),
                source: 'ADMIN_OP',
                action: 'UPDATE_PREFERENCES',
                entityType: 'USER',
                entityId: EntityIdSchema.parse(session.user.id),
                reason: 'User moved to users automatically',
                correlationId
            });
        }

        return NextResponse.json({
            success: true,
            preferences: user.preferences || {}
        });
    } catch (error) {
        return handleApiError(error, 'API_USER_PREFERENCES_GET', correlationId);
    }
}

async function POST_internal(req: Request) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('user:profile', 'manage');

        const body = await req.json();
        const validated = PreferencesUpdateSchema.parse(body);

        const userCollection = await getTenantCollection<User>('users', session, 'AUTH');
        const user = await userCollection.findOne({ email: session.user.email as string });

        if (!user) throw new AppError('NOT_FOUND', 404, 'User not found');

        const previousPreferences = { ...user.preferences };
        const newPreferences = {
            ...user.preferences,
            ...validated,
            onboarding: {
                ...(user.preferences?.onboarding || {}),
                ...(validated.onboarding || {})
            }
        };

        await userCollection.updateOne(
            { email: session.user.email as string },
            { $set: { preferences: newPreferences } }
        );

        // Record Audit Trail
        await AuditService.record({
            actorType: 'USER',
            actorId: EntityIdSchema.parse(session.user.id),
            tenantId: TenantIdSchema.parse(session.user.tenantId),
            source: 'ADMIN_OP',
            action: validated.onboarding?.completed ? 'COMPLETE_ONBOARDING' : 'UPDATE_PREFERENCES',
            entityType: 'USER',
            entityId: EntityIdSchema.parse(session.user.id),
            changes: {
                before: previousPreferences,
                after: newPreferences
            },
            correlationId
        });

        return NextResponse.json({
            success: true,
            preferences: newPreferences,
            correlationId
        });
    } catch (error) {
        return handleApiError(error, 'API_USER_PREFERENCES_POST', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/user/preferences', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/user/preferences', thresholdMs: 1000 });
