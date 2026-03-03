import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { enforcePermission } from '@/lib/guardian-guard';
import { handleApiError } from '@/lib/errors';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

async function GET_internal(request: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await enforcePermission('platform:settings', 'manage');
        const db = await connectAuthDB();
        const user = await db.collection('users').findOne({ email: 'admin@abd.com' });
        const userCount = await db.collection('users').countDocuments();

        return NextResponse.json({
            status: 'ok', connectedDB: db.databaseName, userCount, adminUserFound: !!user,
            deployTimestamp: new Date().toISOString(), nodeEnv: process.env.NODE_ENV,
            passwordCheck: user ? await bcrypt.compare('super123', user.password) : 'UserNotFound'
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_HEALTH_DB_CHECK', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/health/db-check', thresholdMs: 1000 });
