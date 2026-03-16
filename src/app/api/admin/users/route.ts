import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { requirePermission } from '@/lib/auth';
import { UserRole } from "@/types/roles";
import bcrypt from 'bcryptjs';
import { CreateUserSchema, UserSchema } from '@/lib/schemas';
import { handleApiError, ValidationError, DatabaseError } from '@/lib/errors';
import { z } from 'zod';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { AppError } from '@/lib/errors';
import crypto from 'node:crypto';

const API_SOURCE = 'API_ADMIN_USERS';

/**
 * GET /api/admin/users
 * Lists all users (ADMIN only)
 * SLA: P95 < 200ms
 */
export const GET = withPerformanceSLA(async function GET(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: API_SOURCE, action: 'LIST_USERS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('user', 'read');
                
                // 🛡️ [SECURITY] Layered Rate Limiting (Phase 451)
                const { success: rateLimitOk } = await checkRateLimit(session.user.id, LIMITS.ADMIN);
                if (!rateLimitOk) {
                    throw new AppError('FORBIDDEN', 429, 'Demasiadas consultas de usuarios. Por favor, espera.');
                }

                const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;

                // Dynamic filter: SuperAdmin sees everything, Admin sees their allowed tenants
                let filter: Record<string, unknown> = {};
                if (!isSuperAdmin) {
                    const allowedIds = [
                        session.user.tenantId,
                        ...(session.user.tenantAccess || []).map(t => t.tenantId)
                    ].filter(Boolean);

                    filter = { tenantId: { $in: allowedIds } };
                }

                // 🛡️ [PHASE 460] STANDARDIZED USER DISCOVERY
                const usersCollection = await getTenantCollection<any>('users', session as any, 'AUTH');
                
                const users = await usersCollection.aggregate([
                    { $match: filter },
                    { $sort: { createdAt: -1 } },
                    {
                        $lookup: {
                            from: 'mfa_configs',
                            let: { userId: { $toString: "$_id" } },
                            pipeline: [
                                { $match: { $expr: { $eq: ["$userId", "$$userId"] } } },
                                { $project: { enabled: 1 } }
                            ],
                            as: 'mfaConfig'
                        }
                    },
                    {
                        $addFields: {
                            mfaEnabled: { $ifNull: [{ $arrayElemAt: ["$mfaConfig.enabled", 0] }, false] }
                        }
                    },
                    { $project: { password: 0, mfaConfig: 0, mfaSecret: 0, activationToken: 0 } }
                ]).toArray();

                return NextResponse.json({ success: true, users, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, API_SOURCE, correlationId);
            }
        }
    );
}, { endpoint: 'GET /api/admin/users', thresholdMs: 200 });

/**
 * POST /api/admin/users
 * Creates a new user (ADMIN or SUPER_ADMIN)
 * SLA: P95 < 1000ms
 */
export const POST = withPerformanceSLA(async function POST(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: API_SOURCE, action: 'CREATE_USER' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('user', 'manage');

                // 🛡️ [SECURITY] Layered Rate Limiting (Phase 451)
                const { success: rateLimitOk } = await checkRateLimit(session.user.id, LIMITS.ADMIN);
                if (!rateLimitOk) {
                    throw new AppError('FORBIDDEN', 429, 'Demasiadas acciones administrativas. Por favor, espera.');
                }

                const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;

                const body = await req.json();

                // RULE #2: Zod Validation BEFORE Processing
                const validated = CreateUserSchema.parse(body);

                // 🛡️ [PHASE 460] STANDARDIZED USER DISCOVERY
                const usersCollection = await getTenantCollection<any>('users', session as any, 'AUTH');

                // Check if email already exists
                const existingUser = await usersCollection.findOne({
                    email: validated.email.toLowerCase().trim()
                });

                if (existingUser) {
                    throw new ValidationError('Email already registered');
                }

                // Generate cryptographically secure temporary password (never returned to client)
                const secureRandomPass = crypto.randomBytes(32).toString('hex');
                const hashedPassword = await bcrypt.hash(secureRandomPass, 12);

                // Generate activation token for secure password setup
                const activationToken = crypto.randomBytes(32).toString('hex');
                const hashedToken = crypto.createHash('sha256').update(activationToken).digest('hex');

                // If Admin, force their tenantId. If SuperAdmin, potentially from body
                const tenantId = isSuperAdmin && body.tenantId
                    ? body.tenantId
                    : session.user.tenantId;

                const newUser: any = {
                    email: validated.email.toLowerCase().trim(),
                    password: hashedPassword,
                    firstName: validated.firstName,
                    lastName: validated.lastName,
                    jobTitle: validated.jobTitle || '',
                    role: validated.role as UserRole,
                    activeModules: (validated.activeModules || ['TECHNICAL', 'RAG']) as ("TECHNICAL" | "RAG" | "FINANCE" | "LEGAL")[],
                    tenantId: (tenantId || process.env.SINGLE_TENANT_ID || 'default') as string,
                    industry: (body.industry || session.user.industry || 'ELEVATORS') as any,
                    isActive: true,
                    mustChangePassword: true,
                    activationToken: hashedToken,
                    activationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                // Validate against master DB schema
                const validatedUser = UserSchema.parse(newUser);
                const result = await usersCollection.insertOne(validatedUser as any);

                if (!result.insertedId) {
                    throw new DatabaseError('Failed to insert user');
                }

                await log({
                    message: `User created: ${validated.email} in tenant ${tenantId}. Activation flow initiated.`,
                    details: { email: validated.email, role: validated.role, tenantId }
                });

                // Determine base URL for activation link
                const baseUrl = process.env.NEXTAUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
                const activationLink = `${baseUrl}/auth-pages/activate?token=${activationToken}`;

                return NextResponse.json({
                    success: true,
                    userId: result.insertedId,
                    activationLink,
                    correlationId
                });
            } catch (error: unknown) {
                if (error instanceof z.ZodError) {
                    return handleApiError(new ValidationError('Invalid user data', error.issues), API_SOURCE, correlationId);
                }
                return handleApiError(error, API_SOURCE, correlationId);
            }
        }
    );
}, { endpoint: 'POST /api/admin/users', thresholdMs: 1000 });
