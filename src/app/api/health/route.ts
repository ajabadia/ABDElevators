import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Basic platform health check.
 */
export const GET = withPerformanceSLA(async (request: NextRequest) => 
    withCorrelation(
        { level: 'INFO', source: 'APIHEALTH', action: 'BASICCHECK' },
        async ({ log, correlationId }) => {
            try {
                const { searchParams } = new URL(request.url);
                const isFull = searchParams.get('full') === 'true';

                const health = {
                    status: 'UP',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
                };

                if (!isFull) {
                    await log({ message: 'Basic health check performed', details: { isFull: false } });
                    return NextResponse.json(health);
                }

                // ISO 27001: Require permission for detailed status
                await requirePermission('platform:settings', 'read');
                const db = await connectDB();
                await db.command({ ping: 1 });

                await log({ 
                    message: 'Full health check performed', 
                    details: { isFull: true, database: 'CONNECTED' } 
                });

                return NextResponse.json({ 
                    ...health, 
                    checks: { 
                        database: 'CONNECTED', 
                        environment: process.env.NODE_ENV 
                    } 
                });
            } catch (error: unknown) {
                return handleApiError(error, 'APIHEALTH', correlationId);
            }
        }
    ),
    { endpoint: 'GET /api/health', thresholdMs: 1000 }
);
