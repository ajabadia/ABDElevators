import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { CreateUserSchema, UserSchema } from '@/lib/schemas';
import { AppError, ValidationError, DatabaseError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/users
 * Lists all users (ADMIN only)
 * SLA: P95 < 200ms
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        const isAdmin = session?.user?.role === 'ADMIN';
        const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

        if (!isAdmin && !isSuperAdmin) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const db = await connectAuthDB();

        // Dynamic filter: SuperAdmin sees everything, Admin sees their allowed tenants
        let filter = {};
        if (isSuperAdmin) {
            filter = {};
        } else {
            const allowedIds = [
                (session?.user as any).tenantId,
                ...((session?.user as any).tenantAccess || []).map((t: any) => t.tenantId)
            ].filter(Boolean);

            filter = { tenantId: { $in: allowedIds } };
        }

        const users = await db.collection('users')
            .find(filter, { projection: { password: 0 } })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({ users });
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            level: 'ERROR',
            source: 'API_ADMIN_USERS',
            action: 'GET_USERS_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error retrieving users').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 200) {
            await logEvento({
                level: 'WARN',
                source: 'API_ADMIN_USERS',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `GET /api/admin/users took ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}

/**
 * POST /api/admin/users
 * Creates a new user (ADMIN or SUPER_ADMIN)
 * SLA: P95 < 1000ms
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

        // RULE #2: Zod Validation BEFORE Processing
        const validated = CreateUserSchema.parse(body);

        const db = await connectAuthDB();

        // Check if email already exists
        const existingUser = await db.collection('users').findOne({
            email: validated.email.toLowerCase().trim()
        });

        if (existingUser) {
            throw new ValidationError('Email already registered');
        }

        // Generate temporary password
        const tempPassword = `temp${Math.random().toString(36).slice(-8)}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // If Admin, force their tenantId. If SuperAdmin, potentially from body
        const tenantId = isSuperAdmin && body.tenantId
            ? body.tenantId
            : (session?.user as any).tenantId;

        const newUser = {
            email: validated.email.toLowerCase().trim(),
            password: hashedPassword,
            firstName: validated.firstName,
            lastName: validated.lastName,
            jobTitle: validated.jobTitle || '',
            role: validated.role,
            activeModules: validated.activeModules || ['TECHNICAL', 'RAG'],
            tenantId: tenantId || process.env.SINGLE_TENANT_ID,
            industry: body.industry || (session?.user as any).industry || 'ELEVATORS',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Validate against master DB schema
        const validatedUser = UserSchema.parse(newUser);
        const result = await db.collection('users').insertOne(validatedUser);

        if (!result.insertedId) {
            throw new DatabaseError('Failed to insert user');
        }

        await logEvento({
            level: 'INFO',
            source: 'API_ADMIN_USERS',
            action: 'CREATE_USER',
            message: `User created: ${validated.email} in tenant ${tenantId}`,
            correlationId,
            details: { email: validated.email, role: validated.role, tenantId }
        });

        return NextResponse.json({
            success: true,
            userId: result.insertedId,
            tempPassword,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Invalid user data', error.issues).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_ADMIN_USERS',
            action: 'CREATE_USER_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error creating user').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 1000) {
            await logEvento({
                level: 'WARN',
                source: 'API_ADMIN_USERS',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `POST /api/admin/users took ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}
