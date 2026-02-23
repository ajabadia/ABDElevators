import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { User, AuditTrail } from '@/lib/schemas';
import { AuditService } from '@/lib/audit-service';
import { AppError } from '@/lib/errors';
import { z } from 'zod';

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

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) throw new AppError('UNAUTHORIZED', 401, 'No session');

        const userCollection = await getTenantCollection<User>('v2_users', session, 'AUTH');
        const user = await userCollection.findOne({ email: session.user.email });

        if (!user) throw new AppError('NOT_FOUND', 404, 'User not found');

        return NextResponse.json({
            success: true,
            preferences: user.preferences || {}
        });
    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        }
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    // The AuditService.generateCorrelationId() call is correct.
    // The definition of generateCorrelationId should be in the AuditService class file.
    // Assuming the user intended to show the *implementation* of generateCorrelationId
    // and that randomUUID needs to be imported for it.
    // The provided snippet for generateCorrelationId is a class method, not a function
    // to be placed directly in POST.
    // If AuditService is a class, its method would be defined like this:
    // class AuditService {
    //     static generateCorrelationId(): string {
    //         try {
    //             return randomUUID();
    //         } catch (e) {
    //             return Math.random().toString(36).substring(2, 15);
    //         }
    //     }
    //     // ... other methods
    // }
    // Since AuditService is imported, we only need to ensure randomUUID is available
    // for its implementation (which would be in '@/lib/audit-service').
    // However, if the intent was to *move* the definition here, it's syntactically incorrect
    // to place it inside the POST function.
    // Given the instruction "Fix type mismatches and randomUUID usage" and the snippet,
    // the most direct interpretation for *this file* is to import randomUUID.
    // The snippet itself seems to be a misplaced class method definition.
    // I will assume the user wants to ensure randomUUID is available for use,
    // and that the AuditService class (where generateCorrelationId is defined)
    // would correctly use it.

    const correlationId = AuditService.generateCorrelationId();
    try {
        const session = await auth();
        if (!session?.user?.email || !session?.user?.id || !session?.user?.tenantId) {
            throw new AppError('UNAUTHORIZED', 401, 'Incomplete session');
        }

        const body = await req.json();
        const validated = PreferencesUpdateSchema.parse(body);

        const userCollection = await getTenantCollection<User>('v2_users', session, 'AUTH');
        const user = await userCollection.findOne({ email: session.user.email });

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
            actorId: session.user.id as string,
            tenantId: session.user.tenantId as string,
            source: 'ADMIN_OP',
            action: validated.onboarding?.completed ? 'COMPLETE_ONBOARDING' : 'UPDATE_PREFERENCES',
            entityType: 'USER',
            entityId: session.user.id,
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
        console.error('[Preferences Error]:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, message: 'Validation failed', errors: error.issues }, { status: 400 });
        }
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        }
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
