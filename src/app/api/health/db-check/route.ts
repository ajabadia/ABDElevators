import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import bcrypt from 'bcryptjs';
import { withCorrelation } from '@/lib/logger/with-correlation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/db-check
 * Connectivity check for the AUTH database cluster.
 */
export const GET = withPerformanceSLA(async (request: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APIHEALTH_DB', action: 'AUTHDBCHECK' },
        async ({ log, correlationId }) => {
            try {
                // Admin-level permission required
                await requirePermission('platform:settings', 'manage');
                
                const db = await connectAuthDB();
                const user = await db.collection('users').findOne({ email: 'admin@abd.com' });
                const userCount = await db.collection('users').countDocuments();

                await log({
                    message: 'Auth DB connectivity check performed',
                    details: {
                        dbName: db.databaseName,
                        userCount,
                        adminFound: !!user
                    }
                });

                return NextResponse.json({
                    status: 'ok',
                    connectedDB: db.databaseName,
                    userCount,
                    adminUserFound: !!user,
                    deployTimestamp: new Date().toISOString(),
                    nodeEnv: process.env.NODE_ENV,
                    passwordCheck: user ? await bcrypt.compare('super123', user.password) : 'UserNotFound'
                });
            } catch (error: unknown) {
                return handleApiError(error, 'APIHEALTH_DB', correlationId);
            }
        }
    ),
    { endpoint: 'GET /api/health/db-check', thresholdMs: 1000 }
);
