import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { redis } from '@/lib/redis';
import { getGenAI } from '@/lib/gemini-client';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

export const dynamic = 'force-dynamic';

async function GET_internal(request: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        // 🔒 ISO 27001: Only users with platform:settings read permission can access deep health
        await requirePermission('platform:settings', 'read');

        const checks: Record<string, any> = {};

        // 1. Database Check (MongoDB)
        try {
            const db = await connectDB();
            const ping = await db.command({ ping: 1 });
            checks.database = ping.ok === 1 ? 'UP' : 'DEGRADED';
        } catch (err) {
            checks.database = 'DOWN';
        }

        // 2. Cache Check (Redis)
        try {
            await redis.set('health_check', 'ok', { ex: 5 });
            const val = await redis.get('health_check');
            checks.redis = val === 'ok' ? 'UP' : 'DEGRADED';
        } catch (err) {
            checks.redis = 'DOWN';
        }

        // 3. AI Check (Gemini)
        try {
            const genAI = getGenAI();
            // Just check if we can get a model instance (basic env check)
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            checks.gemini = model ? 'UP' : 'DEGRADED';
        } catch (err) {
            checks.gemini = 'DOWN';
        }

        // 4. Infrastructure Stats
        const stats = {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
            env: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        };

        const overallStatus = Object.values(checks).every(v => v === 'UP') ? 'UP' : 'DEGRADED';

        return NextResponse.json({
            status: overallStatus,
            correlationId,
            checks,
            stats
        });

    } catch (error: unknown) {
        return handleApiError(error, 'DEEP_HEALTH_CHECK', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, {
    endpoint: 'GET /api/health/deep',
    thresholdMs: 1500
});
