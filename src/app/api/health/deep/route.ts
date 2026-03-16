import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { redis } from '@/lib/redis';
import { getGenAI } from '@/lib/gemini-client';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { Redis } from '@upstash/redis';
import { Queue } from 'bullmq';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/deep
 * Comprehensive performance and connectivity audit (Phase 292).
 */
export const GET = withPerformanceSLA(async (request: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APIHEALTH_DEEP', action: 'SYSTEMCHECK' },
        async ({ log, correlationId }) => {
            try {
                // 🔒 ISO 27001 Access Control
                await requirePermission('platform:settings', 'read');

                const checks: Record<string, string> = {};
                const details: Record<string, any> = {};

                // 1. Database Check (MongoDB)
                try {
                    const db = await connectDB();
                    const ping = await db.command({ ping: 1 });
                    checks.database = ping.ok === 1 ? 'UP' : 'DEGRADED';
                } catch (err: any) {
                    checks.database = 'DOWN';
                    details.database = err.message;
                }

                // 2. Cache Check (Redis - using imported client)
                try {
                    await redis.set('health_check', 'ok', { ex: 5 });
                    const val = await redis.get('health_check');
                    checks.redisClient = val === 'ok' ? 'UP' : 'DEGRADED';
                } catch (err: any) {
                    checks.redisClient = 'DOWN';
                    details.redisClient = err.message;
                }

                // 3. AI Check (Gemini)
                try {
                    const genAI = getGenAI();
                    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                    checks.gemini = model ? 'UP' : 'DEGRADED';
                } catch (err: any) {
                    checks.gemini = 'DOWN';
                    details.gemini = err.message;
                }

                // 4. Redis Ping Check (using Upstash Redis client)
                try {
                    const upstashRedis = new Redis({
                        url: process.env.UPSTASH_REDIS_REST_URL || '',
                        token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
                    });
                    const ping = await upstashRedis.ping();
                    checks.redisPing = ping === 'PONG' ? 'UP' : 'DEGRADED';
                } catch (e: any) {
                    checks.redisPing = 'DOWN';
                    details.redisPing = e.message;
                }

                // 5. BullMQ Queue Check
                let testQueue: Queue | null = null;
                try {
                    testQueue = new Queue('health-check-queue', {
                        connection: {
                            host: process.env.REDIS_HOST,
                            port: parseInt(process.env.REDIS_PORT || '6379'),
                            password: process.env.REDIS_PASSWORD,
                        },
                    });
                    const isPaused = await testQueue.isPaused();
                    checks.bullMQQueue = isPaused === false ? 'UP' : 'DEGRADED';
                } catch (e: any) {
                    checks.bullMQQueue = 'DOWN';
                    details.bullMQQueue = e.message;
                } finally {
                    if (testQueue) {
                        await testQueue.close();
                    }
                }

                // 6. Infrastructure Stats
                const stats = {
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage(),
                    nodeVersion: process.version,
                    env: process.env.NODE_ENV,
                    timestamp: new Date().toISOString()
                };

                const overallStatus = Object.values(checks).every(v => v === 'UP') ? 'UP' : 'DEGRADED';

                await log({
                    message: `System health audit: ${overallStatus}`,
                    details: { checks, stats: { uptime: stats.uptime, env: stats.env } }
                });

                return NextResponse.json({
                    status: overallStatus,
                    correlationId,
                    checks,
                    stats
                });

            } catch (error: unknown) {
                return handleApiError(error, 'APIHEALTH_DEEP', correlationId);
            }
        }
    ),
    { endpoint: 'GET /api/health/deep', thresholdMs: 1500 }
);
